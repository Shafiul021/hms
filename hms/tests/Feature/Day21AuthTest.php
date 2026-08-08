<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Day 21 — Auth Module Feature Tests
 *
 * Covers: register, login (success + wrong credentials), logout,
 *         /me endpoint, and wrong-role 403 guard.
 */
class Day21AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed Spatie roles
        foreach (['admin', 'doctor', 'nurse', 'patient', 'receptionist'] as $role) {
            \Spatie\Permission\Models\Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function registerUser(array $overrides = []): array
    {
        $payload = array_merge([
            'name'                  => 'Test User',
            'email'                 => 'user@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
            'role'                  => 'patient',
        ], $overrides);

        $response = $this->postJson('/api/auth/register', $payload);

        return [$response, $payload];
    }

    // ── Registration Tests ────────────────────────────────────────────────────

    /** @test */
    public function test_user_can_register_successfully(): void
    {
        [$response] = $this->registerUser();

        $response->assertStatus(201)
            ->assertJsonStructure([
                'user'  => ['id', 'name', 'email', 'roles'],
                'token',
            ]);

        $this->assertDatabaseHas('users', ['email' => 'user@test.com']);
    }

    /** @test */
    public function test_registration_requires_name(): void
    {
        $this->postJson('/api/auth/register', [
            'email'                 => 'user@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(422)
          ->assertJsonValidationErrors(['name']);
    }

    /** @test */
    public function test_registration_requires_unique_email(): void
    {
        $this->registerUser();

        // Re-register with same email
        [$second] = $this->registerUser();

        $second->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function test_registration_requires_password_confirmation(): void
    {
        $this->postJson('/api/auth/register', [
            'name'                  => 'Test User',
            'email'                 => 'user2@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'different',
        ])->assertStatus(422)
          ->assertJsonValidationErrors(['password']);
    }

    /** @test */
    public function test_registration_rejects_invalid_role(): void
    {
        $this->postJson('/api/auth/register', [
            'name'                  => 'Hacker',
            'email'                 => 'hacker@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
            'role'                  => 'superadmin', // not a valid role
        ])->assertStatus(422)
          ->assertJsonValidationErrors(['role']);
    }

    // ── Login Tests ───────────────────────────────────────────────────────────

    /** @test */
    public function test_user_can_login_with_valid_credentials(): void
    {
        [$register] = $this->registerUser();
        $register->assertStatus(201);

        $this->postJson('/api/auth/login', [
            'email'    => 'user@test.com',
            'password' => 'password123',
        ])->assertStatus(200)
          ->assertJsonStructure(['user', 'token']);
    }

    /** @test */
    public function test_login_fails_with_wrong_password(): void
    {
        $this->registerUser();

        $this->postJson('/api/auth/login', [
            'email'    => 'user@test.com',
            'password' => 'wrongpassword',
        ])->assertStatus(401)
          ->assertJsonPath('message', 'Invalid credentials.');
    }

    /** @test */
    public function test_login_fails_with_non_existent_email(): void
    {
        $this->postJson('/api/auth/login', [
            'email'    => 'nobody@nowhere.com',
            'password' => 'password123',
        ])->assertStatus(401);
    }

    /** @test */
    public function test_login_requires_email_and_password(): void
    {
        $this->postJson('/api/auth/login', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    // ── Authenticated Endpoint Tests ─────────────────────────────────────────

    /** @test */
    public function test_me_returns_authenticated_user(): void
    {
        [$register] = $this->registerUser();
        $token = $register->json('token');

        $this->withToken($token)
            ->getJson('/api/auth/me')
            ->assertStatus(200)
            ->assertJsonPath('email', 'user@test.com');
    }

    /** @test */
    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/auth/me')
            ->assertStatus(401);
    }

    /** @test */
    public function test_user_can_logout(): void
    {
        [$register] = $this->registerUser();
        $token = $register->json('token');

        $this->withToken($token)
            ->postJson('/api/auth/logout')
            ->assertStatus(200)
            ->assertJsonPath('message', 'Logged out successfully.');

        // Clear auth guard cache for subsequent request in same test execution
        $this->app['auth']->forgetGuards();

        // After logout the token should be revoked
        $this->withToken($token)
            ->getJson('/api/auth/me')
            ->assertStatus(401);
    }

    // ── Role-Based Authorization (403) Tests ──────────────────────────────────

    /** @test */
    public function test_patient_cannot_access_admin_only_endpoint(): void
    {
        [$register] = $this->registerUser(['role' => 'patient']);
        $token = $register->json('token');

        $this->withToken($token)
            ->getJson('/api/admin/stats')
            ->assertStatus(403);
    }

    /** @test */
    public function test_patient_cannot_list_all_patients(): void
    {
        [$register] = $this->registerUser(['role' => 'patient']);
        $token = $register->json('token');

        $this->withToken($token)
            ->getJson('/api/patients')
            ->assertStatus(403);
    }

    /** @test */
    public function test_patient_cannot_create_a_doctor(): void
    {
        [$register] = $this->registerUser(['role' => 'patient']);
        $token = $register->json('token');

        $this->withToken($token)
            ->postJson('/api/doctors', [])
            ->assertStatus(403);
    }

    /** @test */
    public function test_doctor_can_access_patient_list_with_role_filter(): void
    {
        // Doctors should be able to list patients (per HMS_API_Reference.md contract)
        $doctor = User::factory()->create();
        $doctor->assignRole('doctor');

        $token = $doctor->createToken('t')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/patients')
            ->assertStatus(200);
    }

    /** @test */
    public function test_unauthenticated_request_to_protected_route_returns_401(): void
    {
        $this->getJson('/api/patients')
            ->assertStatus(401);
    }
}

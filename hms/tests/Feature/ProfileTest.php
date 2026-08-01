<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles
        foreach (['admin', 'doctor', 'nurse', 'patient', 'receptionist'] as $role) {
            \Spatie\Permission\Models\Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        // Create a default user
        $this->user = User::create([
            'name'     => 'Original Name',
            'email'    => 'original@hms.com',
            'password' => Hash::make('password123'),
        ]);
        $this->user->assignRole('patient');
    }

    /** @test */
    public function test_authenticated_user_can_update_profile(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->patchJson('/api/auth/profile', [
            'name'  => 'New Name',
            'email' => 'newemail@hms.com',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Profile updated successfully.',
                'user'    => [
                    'name'  => 'New Name',
                    'email' => 'newemail@hms.com',
                ]
            ]);

        $this->assertDatabaseHas('users', [
            'id'    => $this->user->id,
            'name'  => 'New Name',
            'email' => 'newemail@hms.com',
        ]);
    }

    /** @test */
    public function test_profile_update_requires_name_and_valid_email(): void
    {
        Sanctum::actingAs($this->user);

        $this->patchJson('/api/auth/profile', [
            'name'  => '',
            'email' => 'not-an-email',
        ])->assertStatus(422)
          ->assertJsonValidationErrors(['name', 'email']);
    }

    /** @test */
    public function test_user_cannot_update_email_to_existing_email(): void
    {
        User::create([
            'name'     => 'Other User',
            'email'    => 'taken@hms.com',
            'password' => Hash::make('password123'),
        ]);

        Sanctum::actingAs($this->user);

        $this->patchJson('/api/auth/profile', [
            'name'  => 'New Name',
            'email' => 'taken@hms.com',
        ])->assertStatus(422)
          ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function test_authenticated_user_can_change_password_with_correct_current_password(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->patchJson('/api/auth/password', [
            'current_password'      => 'password123',
            'password'              => 'newsecurepassword',
            'password_confirmation' => 'newsecurepassword',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Password changed successfully.',
            ]);

        $this->user->refresh();
        $this->assertTrue(Hash::check('newsecurepassword', $this->user->password));
    }

    /** @test */
    public function test_password_change_fails_if_current_password_is_incorrect(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->patchJson('/api/auth/password', [
            'current_password'      => 'wrongpassword',
            'password'              => 'newsecurepassword',
            'password_confirmation' => 'newsecurepassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);
    }

    /** @test */
    public function test_password_change_fails_if_new_password_does_not_match_confirmation(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->patchJson('/api/auth/password', [
            'current_password'      => 'password123',
            'password'              => 'newsecurepassword',
            'password_confirmation' => 'mismatch',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }
}

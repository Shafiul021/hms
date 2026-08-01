# Stage 1: Build the frontend assets
FROM node:20-alpine AS assets-builder
WORKDIR /app
COPY package*.json ./
COPY packages/hms-ui/package*.json ./packages/hms-ui/
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Final PHP FPM production image
FROM php:8.3-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    bash \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    git \
    oniguruma-dev \
    libzip-dev \
    icu-dev \
    supervisor

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip xml intl

# Install Redis extension
RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy existing application directory contents
COPY . /var/www/html

# Copy compiled frontend assets from Stage 1
COPY --from=assets-builder /app/public/build /var/www/html/public/build

# Copy Supervisor configurations
COPY docker/supervisor/supervisord.conf /etc/supervisor/supervisord.conf
COPY docker/supervisor/horizon.conf /etc/supervisor/conf.d/horizon.conf
COPY docker/supervisor/scheduler.conf /etc/supervisor/conf.d/scheduler.conf

# Adjust permissions
RUN chown -R www-data:www-data /var/www/html

EXPOSE 9000
CMD ["php-fpm"]


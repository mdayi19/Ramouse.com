<?php

namespace Database\Factories;

use App\Models\InternationalLicenseRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\InternationalLicenseRequest>
 */
class InternationalLicenseRequestFactory extends Factory
{
    protected $model = InternationalLicenseRequest::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'full_name' => $this->faker->name(),
            'phone' => $this->faker->phoneNumber(),
            'nationality' => $this->faker->randomElement(['syrian', 'non_syrian']),
            'personal_photo' => $this->faker->imageUrl(),
            'id_document' => $this->faker->imageUrl(),
            'passport_document' => $this->faker->imageUrl(),
            'price' => $this->faker->randomFloat(2, 50, 500),
            'payment_method' => $this->faker->randomElement(['credit_card', 'bank_transfer', 'cash']),
            'proof_of_payment' => $this->faker->imageUrl(),
            'payment_status' => $this->faker->randomElement(['pending', 'paid', 'rejected']),
            'status' => $this->faker->randomElement(['pending', 'payment_check', 'documents_check', 'in_work', 'ready_to_handle', 'rejected']),
            'admin_note' => $this->faker->sentence(),
            'order_number' => $this->faker->unique()->numerify('ORD-#####'),
        ];
    }
}

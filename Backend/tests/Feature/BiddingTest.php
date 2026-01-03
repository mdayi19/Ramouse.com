<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Customer;
use App\Models\Auction;
use App\Models\AuctionCar;
use App\Models\AuctionRegistration;
use App\Models\AuctionBid;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

class BiddingTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Customer $customer;
    protected Auction $auction;
    protected AuctionCar $car;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test user and customer
        $this->user = User::factory()->create([
            'role' => 'customer',
        ]);

        $this->customer = Customer::factory()->create([
            'user_id' => $this->user->id,
            'wallet_balance' => 50000,
        ]);

        // Create auction car
        $this->car = AuctionCar::create([
            'title' => 'Test Car',
            'condition' => 'used',
            'starting_price' => 10000,
            'deposit_amount' => 1000,
            'seller_type' => 'admin',
            'status' => 'in_auction',
        ]);

        // Create live auction
        $this->auction = Auction::create([
            'auction_car_id' => $this->car->id,
            'title' => 'Test Auction',
            'scheduled_start' => now()->subMinutes(30),
            'scheduled_end' => now()->addMinutes(30),
            'actual_start' => now()->subMinutes(30),
            'starting_bid' => 10000,
            'bid_increment' => 500,
            'status' => 'live',
        ]);

        // Register user for auction
        AuctionRegistration::create([
            'auction_id' => $this->auction->id,
            'user_id' => $this->customer->id,
            'user_type' => 'customer',
            'user_name' => $this->customer->name,
            'status' => 'registered',
            'registered_at' => now(),
        ]);
    }

    /** @test */
    public function registered_user_can_place_valid_bid()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/auctions/{$this->auction->id}/bid", [
                'amount' => 10000,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'تم تقديم المزايدة بنجاح',
            ]);

        $this->assertDatabaseHas('auction_bids', [
            'auction_id' => $this->auction->id,
            'user_id' => $this->customer->id,
            'amount' => 10000,
            'status' => 'valid',
        ]);
    }

    /** @test */
    public function user_cannot_bid_below_minimum()
    {
        // First place a valid bid
        AuctionBid::create([
            'auction_id' => $this->auction->id,
            'user_id' => $this->customer->id,
            'user_type' => 'customer',
            'bidder_name' => 'Another User',
            'amount' => 10000,
            'status' => 'valid',
            'bid_time' => now(),
        ]);

        $this->auction->update(['current_bid' => 10000]);

        // Try to bid below minimum (current + increment)
        $response = $this->actingAs($this->user)
            ->postJson("/api/auctions/{$this->auction->id}/bid", [
                'amount' => 10200, // Less than 10000 + 500 = 10500
            ]);

        $response->assertStatus(500); // Exception thrown
    }

    /** @test */
    public function unregistered_user_cannot_bid()
    {
        // Create another user who is NOT registered
        $otherUser = User::factory()->create(['role' => 'customer']);
        Customer::factory()->create([
            'user_id' => $otherUser->id,
            'wallet_balance' => 50000,
        ]);

        $response = $this->actingAs($otherUser)
            ->postJson("/api/auctions/{$this->auction->id}/bid", [
                'amount' => 10000,
            ]);

        $response->assertStatus(500); // Exception for not registered
    }

    /** @test */
    public function unauthenticated_user_cannot_bid()
    {
        $response = $this->postJson("/api/auctions/{$this->auction->id}/bid", [
            'amount' => 10000,
        ]);

        $response->assertStatus(401);
    }

    /** @test */
    public function bid_updates_auction_current_bid()
    {
        $this->actingAs($this->user)
            ->postJson("/api/auctions/{$this->auction->id}/bid", [
                'amount' => 10000,
            ]);

        $this->auction->refresh();

        $this->assertEquals(10000, $this->auction->current_bid);
        $this->assertEquals(1, $this->auction->bid_count);
    }

    /** @test */
    public function rate_limiting_prevents_rapid_bids()
    {
        // Place first bid
        $this->actingAs($this->user)
            ->postJson("/api/auctions/{$this->auction->id}/bid", [
                'amount' => 10000,
            ]);

        // Try immediate second bid (should be rate limited by Cache)
        $response = $this->actingAs($this->user)
            ->postJson("/api/auctions/{$this->auction->id}/bid", [
                'amount' => 10500,
            ]);

        $response->assertStatus(429);
    }

    /** @test */
    public function bid_on_ended_auction_fails()
    {
        $this->auction->update(['status' => 'ended']);

        $response = $this->actingAs($this->user)
            ->postJson("/api/auctions/{$this->auction->id}/bid", [
                'amount' => 10000,
            ]);

        $response->assertStatus(500); // Exception for auction not live
    }
}

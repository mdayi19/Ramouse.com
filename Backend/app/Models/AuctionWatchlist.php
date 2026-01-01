<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuctionWatchlist extends Model
{
    use HasFactory;

    protected $table = 'auction_watchlist';

    protected $fillable = [
        'user_id',
        'auction_id',
    ];

    /**
     * Get the user who added this to watchlist
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the auction
     */
    public function auction()
    {
        return $this->belongsTo(Auction::class);
    }
}

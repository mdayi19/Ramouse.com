<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('international_license_requests', function (Blueprint $table) {
            // Add rejection type to distinguish between payment, document, and other rejections
            $table->enum('rejection_type', ['payment', 'documents', 'other'])->nullable()->after('status');
            $table->string('id_document_back')->nullable()->after('id_document');
            $table->string('driving_license_front')->nullable()->after('passport_document');
            $table->string('driving_license_back')->nullable()->after('driving_license_front');
            $table->json('rejected_documents')->nullable()->after('admin_note');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('international_license_requests', function (Blueprint $table) {
            $table->dropColumn([
                'id_document_back',
                'driving_license_front',
                'driving_license_back',
                'rejected_documents'
            ]);
        });
    }
};

<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Api\V1\LegalPagesController;
use App\Http\Controllers\Controller;

/**
 * A clean public page (no menu, no login) for a legal text. The mobile app opens it in a web view:
 *   GET /legal/terms_conditions
 *   GET /legal/privacy_policy
 * The text is the portal's own page (Admin > Pages). If it is missing or empty, the fixed text in
 * resources/views/legal/{slug}.blade.php is shown.
 */
class LegalPageController extends Controller
{
    public function show($slug)
    {
        if (!isset(LegalPagesController::PAGES[$slug])) {
            abort(404);
        }

        list($title, $content) = LegalPagesController::resolve($slug);

        return response()->view('legal.page', compact('title', 'content'));
    }

    /**
     * GET /delete-account: how to delete the account and its data (the link Google Play asks for).
     * Public, no login. The text is resources/views/legal/delete_account.blade.php.
     */
    public function deleteAccount()
    {
        return response()->view('legal.delete_account');
    }
}

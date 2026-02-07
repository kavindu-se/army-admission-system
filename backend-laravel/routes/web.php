<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\DataController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\DashboardController;

Route::get('/', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.post');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/applications', [ApplicationController::class, 'index'])->name('applications.index');
    Route::get('/applications/create', [ApplicationController::class, 'create'])->name('applications.create');
    Route::post('/applications', [ApplicationController::class, 'store'])->name('applications.store');
    Route::get('/applications/{application}/edit', [ApplicationController::class, 'edit'])->name('applications.edit');
    Route::put('/applications/{application}', [ApplicationController::class, 'update'])->name('applications.update');
    Route::delete('/applications/{application}', [ApplicationController::class, 'destroy'])->name('applications.destroy');
    Route::post('/applications/{application}/attachments', [ApplicationController::class, 'uploadAttachment'])->name('applications.attachments.upload');
    Route::get('/attachments/{attachment}', [ApplicationController::class, 'downloadAttachment'])->name('attachments.download');

    Route::get('/notice-pdf', [DataController::class, 'notice'])->name('notice.download');
    Route::get('/schools', [DataController::class, 'schools'])->name('schools.list');

    Route::get('/review', [ReviewController::class, 'index'])->name('review.index');
    Route::get('/review/{application}', [ReviewController::class, 'show'])->name('review.show');
    Route::post('/review/{application}/action', [ReviewController::class, 'takeAction'])->name('review.action');

    Route::middleware('role:Admin')->group(function () {
        Route::get('/admin', [AdminUserController::class, 'index'])->name('admin.index');
        Route::get('/admin/filter', [AdminUserController::class, 'index'])->name('admin.filter');
        Route::get('/admin/notice', [DataController::class, 'adminPage'])->name('admin.notice');
        Route::get('/admin/schools', [DataController::class, 'adminPage'])->name('admin.schools');
        Route::post('/admin/notice-pdf', [DataController::class, 'uploadNotice'])->name('admin.notice.upload');
        Route::post('/admin/schools', [DataController::class, 'uploadSchools'])->name('admin.schools.upload');
        Route::get('/admin/users', [AdminUserController::class, 'index'])->name('admin.users');
        Route::post('/admin/users', [AdminUserController::class, 'store'])->name('admin.users.store');
        Route::put('/admin/users/{user}', [AdminUserController::class, 'update'])->name('admin.users.update');
        Route::patch('/admin/users/{user}/toggle', [AdminUserController::class, 'toggle'])->name('admin.users.toggle');
        Route::delete('/admin/users/{user}', [AdminUserController::class, 'destroy'])->name('admin.users.destroy');
    });
});

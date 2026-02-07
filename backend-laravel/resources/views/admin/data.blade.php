@extends('layouts.app')

@section('content')
@php
  $user = auth()->user();
  $displayName = $user?->name ?? 'Admin';
  $profileRole = 'Unit Admin';
  if (strtolower($user?->service_no ?? '') === 'kavindu@gmail.com') $profileRole = 'Super Admin';
  elseif (str_contains($user?->roles ?? '', 'RHQAdmin')) $profileRole = 'RHQ Admin';
  $routeName = \Illuminate\Support\Facades\Route::currentRouteName();
@endphp

<div class="dashboard-shell">
  <aside class="dashboard-sidebar">
    <div class="profile-card">
      <img class="profile-avatar" src="/assets/Sri_Lanka_Army_Logo.png" alt="Admin Avatar">
      <div>
        <div class="profile-name">{{ $displayName }}</div>
        <div class="profile-role">{{ $profileRole }}</div>
      </div>
    </div>
    <nav class="side-menu">
      <a class="side-link" href="{{ route('admin.index') }}">NEW USERS</a>
      <a class="side-link" href="{{ route('admin.filter') }}">USERS</a>
      <a class="side-link {{ $routeName === 'admin.notice' ? 'active' : '' }}" href="{{ route('admin.notice') }}">CHANGE PDF</a>
      <a class="side-link {{ $routeName === 'admin.schools' ? 'active' : '' }}" href="{{ route('admin.schools') }}">CHANGE SCHOOLS</a>
    </nav>
  </aside>

  <main class="dashboard-main">
    @if (session('status'))
      <div class="notice">{{ session('status') }}</div>
    @endif

    @if($routeName === 'admin.notice')
      <div class="page-header">
        <h2>Notice PDF</h2>
      </div>
      <div class="card">
        <h3>Update Notice PDF</h3>
        <p class="muted">
          Current: {{ ($files['notice']['exists'] ?? false) ? $files['notice']['name'].' ('.number_format(($files['notice']['size'] ?? 0) / 1024, 1).' KB)' : 'Not uploaded' }}
        </p>
        <div class="form-actions">
          <a class="ghost-btn notice-download-btn" href="{{ route('notice.download') }}">Download Current PDF</a>
        </div>
        <form method="POST" enctype="multipart/form-data" action="{{ route('admin.notice.upload') }}" class="form-grid">
          @csrf
          <label>
            PDF File
            <input type="file" name="file" accept="application/pdf" required>
          </label>
          <div class="form-actions">
            <button class="primary-btn" type="submit">Upload</button>
          </div>
        </form>
      </div>
    @elseif($routeName === 'admin.schools')
      <div class="page-header">
        <h2>Change Schools</h2>
      </div>
      <div class="card">
        <h3>Update School List (CSV)</h3>
        <p class="muted">
          Current: {{ ($files['schools']['exists'] ?? false) ? $files['schools']['name'].' ('.number_format(($files['schools']['size'] ?? 0) / 1024, 1).' KB)' : 'Not uploaded' }}
        </p>
        <form method="POST" enctype="multipart/form-data" action="{{ route('admin.schools.upload') }}" class="form-grid">
          @csrf
          <input type="hidden" name="medium" value="sinhala">
          <label>
            Schools CSV File
            <input type="file" name="file" accept="text/csv" required>
          </label>
          <div class="form-actions">
            <button class="primary-btn" type="submit">Upload CSV</button>
          </div>
        </form>
      </div>
      <div class="card">
        <h3>Update Tamil Schools (CSV)</h3>
        <p class="muted">
          Current: {{ ($files['tamilschools']['exists'] ?? false) ? $files['tamilschools']['name'].' ('.number_format(($files['tamilschools']['size'] ?? 0) / 1024, 1).' KB)' : 'Not uploaded' }}
        </p>
        <form method="POST" enctype="multipart/form-data" action="{{ route('admin.schools.upload') }}" class="form-grid">
          @csrf
          <input type="hidden" name="medium" value="tamil">
          <label>
            Tamil CSV File
            <input type="file" name="file" accept="text/csv" required>
          </label>
          <div class="form-actions">
            <button class="primary-btn" type="submit">Upload CSV</button>
          </div>
        </form>
      </div>
    @else
      <div class="page-header">
        <h2>Admin Data</h2>
      </div>
      <div class="card-grid">
        <div class="card">
          <h3>Notice PDF</h3>
          <p class="muted">
            Current: {{ ($files['notice']['exists'] ?? false) ? $files['notice']['name'].' ('.number_format(($files['notice']['size'] ?? 0) / 1024, 1).' KB)' : 'Not uploaded' }}
          </p>
          <div class="form-actions">
            <a class="ghost-btn notice-download-btn" href="{{ route('notice.download') }}">Download Notice</a>
          </div>
        </div>
        <div class="card">
          <h3>Schools CSV</h3>
          <p class="muted">
            Current: {{ ($files['schools']['exists'] ?? false) ? $files['schools']['name'].' ('.number_format(($files['schools']['size'] ?? 0) / 1024, 1).' KB)' : 'Not uploaded' }}
          </p>
        </div>
        <div class="card">
          <h3>Schools (Tamil) CSV</h3>
          <p class="muted">
            Current: {{ ($files['tamilschools']['exists'] ?? false) ? $files['tamilschools']['name'].' ('.number_format(($files['tamilschools']['size'] ?? 0) / 1024, 1).' KB)' : 'Not uploaded' }}
          </p>
        </div>
      </div>
    @endif
  </main>
</div>
@endsection

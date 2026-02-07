@extends('layouts.app')

@section('content')
@php
  $user = auth()->user();
  $displayName = $user?->name ?? 'Admin';
  $profileRole = 'Unit Admin';
  if (strtolower($user?->service_no ?? '') === 'kavindu@gmail.com') $profileRole = 'Super Admin';
  elseif (str_contains($user?->roles ?? '', 'RHQAdmin')) $profileRole = 'RHQ Admin';
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
      <a class="side-link active" href="{{ route('admin.index') }}">NEW USERS</a>
      <a class="side-link" href="{{ route('admin.filter') }}">USERS</a>
      <a class="side-link" href="{{ route('admin.notice') }}">CHANGE PDF</a>
      <a class="side-link" href="{{ route('admin.schools') }}">CHANGE SCHOOLS</a>
    </nav>
  </aside>

  <main class="dashboard-main">
    <div class="page-header">
      <h2>Create New Users</h2>
    </div>

    @if (session('status'))
      <div class="notice">{{ session('status') }}</div>
    @endif

    <div class="card">
      <h3>New Users</h3>
      <form class="form-grid" method="POST" action="{{ route('admin.users.store') }}">
        @csrf
        <label>
          e-No
          <input name="service_no" required>
        </label>
        <label>
          Name
          <input name="name" required>
        </label>
        <label>
          Role
          <select name="roles">
            @foreach($roleOptions as $role)
              <option value="{{ $role }}">{{ $role }}</option>
            @endforeach
          </select>
        </label>
        <label>
          Regiment
          <input name="regiment">
        </label>
        <label>
          Unit No
          <input name="unit_no">
        </label>
        <div class="form-actions">
          <button class="primary-btn" type="submit">Assign Role</button>
        </div>
      </form>
    </div>
  </main>
</div>
@endsection

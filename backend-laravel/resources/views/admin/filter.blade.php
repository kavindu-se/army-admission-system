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
      <a class="side-link" href="{{ route('admin.index') }}">NEW USERS</a>
      <a class="side-link active" href="{{ route('admin.filter') }}">USERS</a>
      <a class="side-link" href="{{ route('admin.notice') }}">CHANGE PDF</a>
      <a class="side-link" href="{{ route('admin.schools') }}">CHANGE SCHOOLS</a>
    </nav>
  </aside>

  <main class="dashboard-main">
    <div class="page-header">
      <h2>Filter Users</h2>
    </div>

    @if (session('status'))
      <div class="notice">{{ session('status') }}</div>
    @endif

    <div class="card">
      <h3>Filter Users</h3>
      <form class="form-grid" method="GET" action="{{ route('admin.filter') }}">
        <label>
          Regiment
          <input name="regiment" value="{{ request('regiment') }}" placeholder="All regiments">
        </label>
        <label>
          Unit No
          <input name="unit_no" value="{{ request('unit_no') }}" placeholder="All unit numbers">
        </label>
        <div class="form-actions">
          <button class="primary-btn" type="submit">Apply Filter</button>
        </div>
      </form>
    </div>

    @if($editUser)
      <div class="card">
        <h3>Edit User</h3>
        <form class="form-grid" method="POST" action="{{ route('admin.users.update', $editUser) }}">
          @csrf
          @method('PUT')
          <label>
            Name
            <input name="name" value="{{ $editUser->name }}" required>
          </label>
          <label>
            Roles
            <select name="roles">
              @foreach($roleOptions as $role)
                <option value="{{ $role }}" {{ $editUser->roles === $role ? 'selected' : '' }}>{{ $role }}</option>
              @endforeach
            </select>
          </label>
          <label>
            Regiment
            <input name="regiment" value="{{ $editUser->regiment }}">
          </label>
          <label>
            Unit No
            <input name="unit_no" value="{{ $editUser->unit_no }}">
          </label>
          <div class="form-actions">
            <button class="primary-btn" type="submit">Update User</button>
            <a class="ghost-btn" href="{{ route('admin.filter') }}">Cancel</a>
          </div>
        </form>
      </div>
    @endif

    <div class="card">
      <h3>Users</h3>
      <div class="table-scroll">
        <table class="history-table">
          <thead>
            <tr>
              <th>Service No</th>
              <th>Name</th>
              <th>Roles</th>
              <th>Regiment</th>
              <th>Unit No</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            @forelse($users as $item)
              <tr>
                <td>{{ $item->service_no }}</td>
                <td>{{ $item->name }}</td>
                <td>{{ $item->roles }}</td>
                <td>{{ $item->regiment ?? '-' }}</td>
                <td>{{ $item->unit_no ?? '-' }}</td>
                <td>{{ $item->active ? 'Active' : 'Inactive' }}</td>
                <td class="action-group">
                  <a class="ghost-btn" href="{{ route('admin.filter', ['edit' => $item->id]) }}">Edit</a>
                  <form method="POST" action="{{ route('admin.users.toggle', $item) }}">
                    @csrf
                    @method('PATCH')
                    <button class="{{ $item->active ? 'danger-btn' : 'primary-btn' }}" type="submit">
                      {{ $item->active ? 'Deactivate' : 'Activate' }}
                    </button>
                  </form>
                  <form method="POST" action="{{ route('admin.users.destroy', $item) }}">
                    @csrf
                    @method('DELETE')
                    <button class="danger-btn" type="submit">Delete</button>
                  </form>
                </td>
              </tr>
            @empty
              <tr>
                <td colspan="7" class="muted">No users found.</td>
              </tr>
            @endforelse
          </tbody>
        </table>
      </div>
    </div>
  </main>
</div>
@endsection

<aside class="dashboard-sidebar">
  <div class="profile-card">
    <img class="profile-avatar" src="/assets/Sri_Lanka_Army_Logo.png" alt="Army crest">
    <div>
      <div class="profile-name">{{ auth()->user()->name }}</div>
      <div class="profile-role">{{ auth()->user()->roles }}</div>
    </div>
  </div>
  <div class="side-menu">
    <a class="side-link {{ request()->routeIs('dashboard') ? 'active' : '' }}" href="{{ route('dashboard') }}">Dashboard</a>
    <a class="side-link {{ request()->routeIs('applications.*') ? 'active' : '' }}" href="{{ route('applications.index') }}">Applications</a>
    <a class="side-link {{ request()->routeIs('review.*') ? 'active' : '' }}" href="{{ route('review.index') }}">Review Queue</a>
    @if(str_contains(auth()->user()->roles, 'Admin'))
      <a class="side-link {{ request()->routeIs('admin.index') ? 'active' : '' }}" href="{{ route('admin.index') }}">Admin Panel</a>
      <a class="side-link {{ request()->routeIs('admin.filter') ? 'active' : '' }}" href="{{ route('admin.filter') }}">Users</a>
      <a class="side-link {{ request()->routeIs('admin.notice') ? 'active' : '' }}" href="{{ route('admin.notice') }}">Change PDF</a>
      <a class="side-link {{ request()->routeIs('admin.schools') ? 'active' : '' }}" href="{{ route('admin.schools') }}">Change Schools</a>
    @endif
  </div>
  <a class="primary-btn full-btn" href="{{ route('applications.create') }}">New Application</a>
</aside>

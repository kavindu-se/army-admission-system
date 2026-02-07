@extends('layouts.app')

@section('content')
@php
  $user = auth()->user();
  $displayName = $user?->name ?? 'Reviewer';
  $roleLabel = count($roles) ? $roles[0] : 'Reviewer';
  if (in_array('Admin', $roles, true)) $roleLabel = 'Admin';
  if (in_array('RHQAdmin', $roles, true)) $roleLabel = 'RHQ Admin';
  $pendingCount = $apps->count();
  $historyCount = count($historyRows);
@endphp

<div class="dashboard-shell">
  <aside class="dashboard-sidebar">
    <div class="profile-card">
      <img class="profile-avatar" src="/assets/Sri_Lanka_Army_Logo.png" alt="Reviewer Avatar">
      <div>
        <div class="profile-name">{{ $displayName }}</div>
        <div class="profile-role">{{ $roleLabel }}</div>
      </div>
    </div>
    <nav class="side-menu">
      <button class="side-link active" data-view="pending">PENDING/ACTIONS</button>
      <a class="side-link" href="{{ route('dashboard') }}">DASHBOARD</a>
    </nav>
  </aside>
  <main class="dashboard-main">
    <div class="page-header">
      <h2>Pending / Actions</h2>
      <div class="tab-toggle">
        <button type="button" class="tab-btn" data-queue="pending">Pending <span class="tab-badge">{{ $pendingCount }}</span></button>
        <button type="button" class="tab-btn" data-queue="history">Actions <span class="tab-badge">{{ $historyCount }}</span></button>
      </div>
    </div>
    <div class="queue-list">
      @foreach($apps as $app)
        @php
          $formA = $app->form_a_json ?? [];
          $name = $formA['applicant_name_initials'] ?? $formA['applicant_full_name_caps'] ?? 'Applicant';
          $status = strtoupper(str_replace('_',' ', $app->status ?? '-'));
        @endphp
        <a class="queue-item" data-queue-row="pending" href="{{ route('review.show', $app) }}">
          <div class="queue-item-title">{{ $name }}</div>
          <div class="queue-item-meta">
            <span class="queue-item-status">{{ $status }}</span>
            <span class="stage-chip">{{ $app->current_stage }}</span>
          </div>
        </a>
      @endforeach
      @foreach($historyRows as $row)
        @php
          $app = $row['app'];
          $formA = $app->form_a_json ?? [];
          $name = $formA['applicant_name_initials'] ?? $formA['applicant_full_name_caps'] ?? 'Applicant';
          $status = strtoupper(str_replace('_',' ', $app->status ?? '-'));
          $action = $row['last_action'] ?? '';
          $actionAt = $row['last_action_at'];
        @endphp
        <a class="queue-item" data-queue-row="history" href="{{ route('review.show', $app) }}" style="display:none;">
          <div class="queue-item-title">{{ $name }}</div>
          <div class="queue-item-meta">
            <span class="queue-item-status">{{ $status }}</span>
            <span class="stage-chip">{{ $app->current_stage }}</span>
          </div>
          @if($actionAt)
            <small class="muted queue-item-history">{{ $action }} {{ $actionAt->toDateString() }}</small>
          @endif
        </a>
      @endforeach
      @if($apps->count() === 0)
        <div class="card muted" data-queue-row="pending">Queue is empty.</div>
      @endif
      @if(count($historyRows) === 0)
        <div class="card muted" data-queue-row="history" style="display:none;">No actions taken yet.</div>
      @endif
    </div>
  </main>
</div>

<script>
  (function () {
    const tabs = document.querySelectorAll('[data-queue]');
    const rows = document.querySelectorAll('[data-queue-row]');
    function setView(view) {
      rows.forEach((row) => {
        row.style.display = row.getAttribute('data-queue-row') === view ? '' : 'none';
      });
      tabs.forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-queue') === view);
      });
      localStorage.setItem('reviewQueue.viewMode', view);
    }
    const saved = localStorage.getItem('reviewQueue.viewMode') || 'pending';
    setView(saved);
    tabs.forEach((btn) => btn.addEventListener('click', () => setView(btn.getAttribute('data-queue'))));
  })();
</script>
@endsection

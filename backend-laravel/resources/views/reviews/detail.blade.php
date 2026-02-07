@extends('layouts.app')

@section('content')
@php
  $user = auth()->user();
  $displayName = $user?->name ?? 'Reviewer';
  $roleLabel = count($roles) ? $roles[0] : 'Reviewer';
  if (in_array('Admin', $roles, true)) $roleLabel = 'Admin';
  $formA = $application->form_a_json ?? [];
  $formatStatus = function ($status) {
    if (!$status) return '-';
    return strtoupper(str_replace('_', ' ', $status));
  };
  $roleActions = [
    'UnitSubjectClerk' => ['return', 'forward'],
    'UnitAdjutant' => ['return', 'forward'],
    'UnitCO' => ['return', 'recommend', 'reject'],
    'RHQSubjectClerk' => ['return', 'forward'],
    'RHQGSO' => ['return', 'forward'],
    'CentreCommandant' => ['return', 'recommend'],
    'GSO1' => ['return', 'forward'],
    'DteWelfareClerk' => ['return', 'forward'],
    'DteWelfareGSO2' => ['approve', 'reject'],
  ];
  $allowedActions = [];
  foreach ($roles as $role) {
    foreach ($roleActions[$role] ?? [] as $action) {
      $allowedActions[$action] = true;
    }
  }
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
      <a class="side-link" href="{{ route('review.index') }}">PENDING/ACTIONS</a>
      <a class="side-link" href="{{ route('dashboard') }}">DASHBOARD</a>
    </nav>
  </aside>
  <main class="dashboard-main">
    <div class="page-header">
      <h2>Review Detail</h2>
      <a class="ghost-btn" href="{{ route('review.index') }}">Back to List</a>
    </div>
    <div class="queue-detail">
      <h3>{{ $formA['applicant_full_name_caps'] ?? $formA['applicant_name_initials'] ?? 'Applicant' }}</h3>
      <p>Status: {{ $formatStatus($application->status) }}</p>
      <p>Current Location: {{ $application->current_stage }}</p>

      <div class="card detail-card">
        <h4>Applicant Summary</h4>
        <p><strong>Applicant:</strong> {{ $formA['applicant_full_name_caps'] ?? '-' }}</p>
        <p><strong>Service No:</strong> {{ $formA['service_number'] ?? '-' }}</p>
        <p><strong>Unit:</strong> {{ $formA['unit_name'] ?? '-' }}</p>
        <p><strong>Child:</strong> {{ $formA['child_full_name_caps'] ?? '-' }}</p>
        <p><strong>DOB:</strong> {{ $formA['child_dob'] ?? '-' }}</p>
        <p><strong>Gender:</strong> {{ $formA['child_gender'] ?? '-' }}</p>
        <div class="detail-list">
          <strong>School Preferences:</strong>
          <ol>
            @foreach(($formA['schools'] ?? []) as $school)
              @if(!empty($school['census_no']))
                <li>{{ $school['census_no'] }} - {{ $school['name'] }}</li>
              @endif
            @endforeach
          </ol>
        </div>
      </div>

      <div class="card detail-card">
        <h4>Attachments</h4>
        @if($attachments->count() === 0)
          <p class="muted">No attachments.</p>
        @else
          <ul class="attachment-list">
            @foreach($attachments as $file)
              <li>
                <a href="{{ route('attachments.download', $file) }}" target="_blank" rel="noreferrer">{{ $file->filename }}</a>
                <span class="muted"> ({{ $file->type }})</span>
              </li>
            @endforeach
          </ul>
        @endif
      </div>

      <div class="card detail-card">
        <h4>Approval History</h4>
        @if($steps->count() === 0)
          <p class="muted">No history yet.</p>
        @else
          <table class="history-table">
            <thead>
              <tr>
                <th>Level</th>
                <th>Action</th>
                <th>Date</th>
                <th>Time</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>
              @foreach($steps as $step)
                <tr>
                  <td>{{ $step->level }}</td>
                  <td>{{ $step->action }}</td>
                  <td>{{ $step->created_at?->toDateString() }}</td>
                  <td>{{ $step->created_at?->toTimeString() }}</td>
                  <td>{{ $step->comment ?? '-' }}</td>
                </tr>
              @endforeach
            </tbody>
          </table>
        @endif
      </div>

      <form method="POST" action="{{ route('review.action', $application) }}">
        @csrf
        <label>
          Remarks
          <textarea name="comment"></textarea>
        </label>
        <div class="form-actions">
          @if(isset($allowedActions['return']))
            <button class="ghost-btn" name="action" value="return" type="submit">Return</button>
          @endif
          @if(isset($allowedActions['forward']))
            <button class="primary-btn" name="action" value="forward" type="submit">Forward</button>
          @endif
          @if(isset($allowedActions['approve']))
            <button class="primary-btn" name="action" value="approve" type="submit">Approve</button>
          @endif
          @if(isset($allowedActions['recommend']))
            <button class="primary-btn" name="action" value="recommend" type="submit">Recommend</button>
          @endif
          @if(isset($allowedActions['reject']))
            <button class="danger-btn" name="action" value="reject" type="submit">Reject</button>
          @endif
        </div>
      </form>
    </div>
  </main>
</div>
@endsection

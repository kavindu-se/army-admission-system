@extends('layouts.app')

@section('content')
<div class="dashboard-shell">
  @include('partials.sidebar')

  <section class="dashboard-main">
    <div class="page-header">
      <div>
        <h1>Applications</h1>
        <p class="muted">Manage your admission submissions.</p>
      </div>
      <div class="action-group">
        <a class="primary-btn" href="{{ route('applications.create') }}">New Application</a>
      </div>
    </div>

    <div class="card-grid reviewer-card-grid">
      @forelse($apps as $app)
        <a class="card card-button" href="{{ route('applications.edit', $app) }}">
          <div class="reviewer-card-title">Application {{ $app->application_no ?? 'Draft' }}</div>
          <div class="reviewer-card-meta">Academic Year: {{ $app->academic_year }}</div>
          <div class="reviewer-card-meta">Status: {{ $app->status }} · Stage: {{ $app->current_stage }}</div>
        </a>
      @empty
        <div class="card">
          <p class="muted">No applications found. Start a new application to begin.</p>
        </div>
      @endforelse
    </div>
  </section>
</div>
@endsection

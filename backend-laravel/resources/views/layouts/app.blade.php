<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{ $title ?? 'Army Admission' }}</title>
  <link rel="stylesheet" href="/css/app.css">
</head>
<body>
  <div class="app-shell">
    <header class="app-header">
      <a class="brand" href="{{ route('dashboard') }}">School Admission Management System</a>
      <div class="header-right">
        @auth
          <span class="user-chip">{{ auth()->user()->name }}</span>
        @endauth
        <button class="ghost-btn" type="button" id="theme-toggle">Toggle Theme</button>
        @auth
          <form method="POST" action="{{ route('logout') }}">
            @csrf
            <button class="ghost-btn" type="submit">Logout</button>
          </form>
        @endauth
      </div>
    </header>
    <main class="page">
      @if (session('status'))
        <div class="notice">{{ session('status') }}</div>
      @endif
      @if ($errors->any())
        <div class="error">{{ $errors->first() }}</div>
      @endif
      @yield('content')
    </main>
  </div>

  <script>
    (function () {
      const root = document.documentElement;
      const btn = document.getElementById('theme-toggle');
      const saved = localStorage.getItem('theme') || 'dark';
      root.setAttribute('data-theme', saved);
      if (btn) {
        btn.textContent = saved === 'dark' ? 'Light Mode' : 'Dark Mode';
        btn.addEventListener('click', () => {
          const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
          root.setAttribute('data-theme', next);
          localStorage.setItem('theme', next);
          btn.textContent = next === 'dark' ? 'Light Mode' : 'Dark Mode';
        });
      }
    })();
  </script>
</body>
</html>

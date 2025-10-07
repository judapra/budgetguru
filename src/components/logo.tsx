// src/components/logo.tsx

// A prop 'className' agora vai controlar apenas o tamanho. O gradiente já está "embutido".
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 178 141"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Budget Guru Logo"
    >
      {/* Definimos o gradiente aqui dentro com um ID único */}
      <defs>
        <linearGradient
          id="logo-gradient"
          x1="0"
          y1="70.5"
          x2="178"
          y2="70.5"
          gradientUnits="userSpaceOnUse"
        >
          {/* Você pode ajustar as cores do gradiente aqui! */}
          <stop stopColor="#22D3EE" /> {/* Cor inicial (ciano) */}
          <stop offset="1" stopColor="#2563EB" /> {/* Cor final (azul) */}
        </linearGradient>
      </defs>

      {/* Cada path agora usa o gradiente que definimos, através do ID */}
      <path
        d="M88.7 140.3a4.6 4.6 0 01-2-.5Q63.2 128.1 40 116.3c-1-.5-2-.6-3.1-.3a4.5 4.5 0 01-3.5-3.4c-.1-1.3.4-2.6 1.5-3.3 1-.6 2.2-.7 3.4-.2l.2.1q23.3 11.9 46.8 23.5c1 .5 2.1.5 3.1 0q23.5-11.6 46.8-23.5l.2-.1c1.1-.5 2.4-.4 3.4.2 1.1.7 1.6 2 1.5 3.3a4.5 4.5 0 01-3.5 3.4c-1.1.3-2.1.2-3.1-.3Q114.2 128.1 90.7 139.8a4.6 4.6 0 01-2 .5Z"
        fill="url(#logo-gradient)"
      />
      <path
        d="M136.6 111.4c-1 .5-2.1.4-3.1-.2L90.7 87.9a4.5 4.5 0 01-2.9-4.2V4.8a4.5 4.5 0 014.5-4.5c2.5 0 4.5 2 4.5 4.5v76.8l36.7 20.6c1.1.6 1.7 1.9 1.4 3.2-.3 1.3-1.4 2.3-2.7 2.4l-.6.1Z"
        fill="url(#logo-gradient)"
      />
      <path
        d="M40.8 111.2c-1.4 0-2.6-1-3-2.4a3.3 3.3 0 011.4-3.2l36.7-20.6V4.8c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5v78.9a4.5 4.5 0 01-2.9 4.2L43.2 111c-.7.2-1.2.2-1.8.2h-.6Z"
        fill="url(#logo-gradient)"
      />
      <path
        d="M173.8 106.3c-1.4 0-2.7-1-3-2.4a3.3 3.3 0 011.4-3.2L175.7 100l-17.6-9.8a1.6 1.6 0 01-1-1.3l-18-62a4.5 4.5 0 014-5.3 4.5 4.5 0 015.4 4l17.8 61.3L175 92.3c1.1.6 1.7 1.9 1.4 3.2a2.9 2.9 0 01-2.6 2.8h-.2Z"
        fill="url(#logo-gradient)"
      />
      <path
        d="M3.6 106.3c-.2 0-.4 0-.6-.1a2.9 2.9 0 01-2.6-2.8 3.3 3.3 0 011.4-3.2l9.3-5.2 17.8-61.3a4.5 4.5 0 015.4-4 4.5 4.5 0 014 5.3l-18 62a1.6 1.6 0 01-1 1.3L17.1 100l3.5.7.1.1-.3-.1L.1 100l3.5.7.1.1-.3-.1.3.1-17 9.5 3.5.7c1.2.6 1.7 1.9 1.4 3.2a2.9 2.9 0 01-2.6 2.8l-.2-.1Z"
        fill="url(#logo-gradient)"
      />
      <path
        d="M89.2 101.3c-2.5 0-4.5-2-4.5-4.5V23.4a4.5 4.5 0 019 0v73.4c0 2.5-2 4.5-4.5 4.5Z"
        fill="url(#logo-gradient)"
      />
    </svg>
  );
}
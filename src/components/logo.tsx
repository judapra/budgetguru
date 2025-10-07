// src/components/logo.tsx

// A prop 'className' é adicionada para podermos estilizar o tamanho e a cor externamente.
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={className} // A classe é aplicada aqui
      width="200" // Mantive width/height para um tamanho padrão, mas pode ser sobrescrito pelo className
      height="180"
      viewBox="0 0 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Budget Guru Logo" // Adicionei um aria-label para acessibilidade
    >
      {/* O código do seu logo SVG deve ser colado aqui, substituindo este conteúdo */}
      <path
        d="M100 0L200 100H0L100 0Z"
        fill="currentColor" 
        className="text-gray-800 dark:text-gray-200"
      />
      <path
        d="M100 180L200 80H0L100 180Z"
        fill="currentColor"
        className="text-blue-600 dark:text-blue-400"
      />
      <path
        d="M150 90L100 140L50 90H150Z"
        fill="currentColor"
        className="text-white dark:text-gray-900"
      />
    </svg>
  );
}

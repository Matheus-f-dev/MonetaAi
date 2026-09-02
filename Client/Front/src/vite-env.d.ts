/// <reference types="vite/client" />

/* Tipos ambientes pros CSS Modules. Sem isto o TypeScript não sabe o que
   é `import styles from './X.module.css'` e reclama em todo componente do
   design system. `readonly` de propósito: ninguém deveria escrever no
   objeto de classes. */
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

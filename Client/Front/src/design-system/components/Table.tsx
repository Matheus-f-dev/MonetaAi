import { type ReactNode, type TableHTMLAttributes } from 'react';
import styles from './Table.module.css';

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  caption?: string;
  children: ReactNode;
}

/** <table> de verdade -- leitor de tela anuncia linha/coluna sozinho,
 * o que uma grade de <div>s nunca dá de graça. `caption` é o nome
 * acessível da tabela (ex.: "Transações de agosto"), não decoração. */
export function Table({ caption, children, className, ...rest }: TableProps) {
  return (
    <div className={styles.wrap}>
      <table className={[styles.table, className].filter(Boolean).join(' ')} {...rest}>
        {caption && <caption>{caption}</caption>}
        {children}
      </table>
    </div>
  );
}

export function TableNumericCell({ children, ...rest }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={styles.numeric} {...rest}>
      {children}
    </td>
  );
}

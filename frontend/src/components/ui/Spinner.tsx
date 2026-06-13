import styles from './Spinner.module.css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'accent' | 'white' | 'muted';
}

export function Spinner({ size = 'md', color = 'accent' }: SpinnerProps) {
  return (
    <span
      className={[styles.spinner, styles[size], styles[color]].join(' ')}
      role="status"
      aria-label="Cargando"
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className={styles.fullPage}>
      <Spinner size="lg" />
    </div>
  );
}

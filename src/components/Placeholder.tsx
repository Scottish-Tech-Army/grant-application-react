import styles from './styles.module.css';

type PlaceholderProps = {
  title?: string;
};

export function Placeholder({ title = 'Placeholder' }: PlaceholderProps) {
  return (
    <section className={styles.container}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.subtitle}>Replace this with a real component.</p>
    </section>
  );
}

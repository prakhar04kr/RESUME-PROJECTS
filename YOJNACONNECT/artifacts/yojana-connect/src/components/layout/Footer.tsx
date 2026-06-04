export function Footer() {
  return (
    <footer className="border-t bg-muted/40 py-8 mt-12">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} YojanaConnect. A civic technology portal.</p>
        <p className="mt-1">Built for the citizens of India.</p>
      </div>
    </footer>
  );
}

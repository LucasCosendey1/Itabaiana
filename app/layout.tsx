// app/layout.js
import './globals.css';

export const metadata = {
  title: 'Transporte SUS - Itabaiana/PB',
  description: 'Sistema de Transporte para Cidadãos que Precisam de Cirurgia pelo SUS',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
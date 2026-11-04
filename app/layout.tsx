import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'TenantDesk — your work, together',description:'A functional portfolio demonstration of a client portal with server-side tenant access controls. All data is synthetic.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}

import type {Metadata} from "next";
export const metadata:Metadata={robots:{index:false,follow:false},title:{default:"Store Admin | Crolina Store",template:"%s | Crolina Admin"}};
export default function AdminLayout({children}:{children:React.ReactNode}){return children}

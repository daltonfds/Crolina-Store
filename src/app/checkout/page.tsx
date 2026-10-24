import CheckoutClient from "./checkout-client";
export const metadata={title:"Checkout | Crolina Store"};
export default function CheckoutPage(){return <main className="container checkout-page"><a href="/" className="back">← Continue shopping</a><h1>Checkout</h1><p className="muted">Guest checkout is available — no account required.</p><CheckoutClient/></main>}

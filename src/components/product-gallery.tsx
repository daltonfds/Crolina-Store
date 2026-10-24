"use client";
import {useState} from "react";
import {ChevronLeft,ChevronRight,Image as ImageIcon} from "lucide-react";
export default function ProductGallery({images,name}:{images:string[];name:string}) {
 const valid=images.filter((x)=>typeof x==="string"&&x.trim().length>0);
 const [active,setActive]=useState(0);
 if(!valid.length)return <div className="pdp-image"><div className="pdp-placeholder">CROLINA<br/>SHOP</div></div>;
 const move=(delta:number)=>setActive((i)=>(i+delta+valid.length)%valid.length);
 return <div className="product-gallery"><div className="gallery-main"><img src={valid[active]} alt={name+" — image "+(active+1)} fetchPriority="high"/>{valid.length>1&&<><button className="gallery-arrow gallery-prev" type="button" onClick={()=>move(-1)} aria-label="Previous image"><ChevronLeft/></button><button className="gallery-arrow gallery-next" type="button" onClick={()=>move(1)} aria-label="Next image"><ChevronRight/></button><span className="gallery-count">{active+1} / {valid.length}</span></>}</div>{valid.length>1&&<div className="gallery-thumbs" aria-label="Product image gallery">{valid.map((src,i)=><button type="button" key={src+i} className={"gallery-thumb"+(i===active?" active":"")} onClick={()=>setActive(i)} aria-label={"Show image "+(i+1)} aria-pressed={i===active}><img src={src} alt={name+" thumbnail "+(i+1)} loading="lazy"/></button>)}</div>}{valid.length===1&&<p className="gallery-single"><ImageIcon size={14}/> Product image</p>}</div>;
}

(()=>{"use strict";var e={9746:function(e,t,r){var n,l,i=r(2676),o=r(8751),c=((n={}).selection="selection",n.rectangle="rectangle",n.circle="circle",n.arrow="arrow",n.text="text",n.diamond="diamond",n),a=((l={}).default="default",l.crosshair="crosshair",l.move="move",l.grab="grab",l.neswResize="nesw-resize",l.nwseResize="nwse-resize",l),d=r(634),u=r(4872),s=r(6369),h=r(8174),f=r(1458),p=r(223);let y=[{type:c.selection,Icon:d.Z},{type:c.rectangle,Icon:u.Z},{type:c.circle,Icon:s.Z},{type:c.diamond,Icon:h.Z},{type:c.text,Icon:f.Z},{type:c.arrow,Icon:p.Z}],g="Segoe UI Emoji",m="SPICY_CHICKEN_DRAW",v=[3,2],x=[c.circle,c.diamond,c.rectangle],w="CLEAR",b="IMPORT",R="EXPORT",M="EXPORT_IMAGE",E={theme:"outline",size:"20",fill:"#333"};var _=r(6398);let Z=(0,_.cn)(c.selection),j=(0,_.cn)(a.default);var k=r(9981),O=r.n(k),T=r(7070),I=r(4181);let S=()=>{let[e,t]=(0,_.KO)(Z),r=(0,_.b9)(j);return(0,T.Z)(Array(y.length).fill(null).map((e,t)=>String(t+1)),e=>{let r=y[Number(e.key)-1];r&&t(r.type)}),(0,I.Z)(()=>{e!==c.selection&&r(a.crosshair)},[e]),(0,i.jsx)("div",{className:"flex absolute top-3 left-1/2 -translate-x-1/2 rounded bg-slate-50 shadow",children:y.map((r,n)=>{let{Icon:l,type:o}=r;return(0,i.jsxs)("div",{className:O()("w-11 h-10 flex items-center justify-center flex-col cursor-pointer",e===o?"bg-slate-300":"hover:bg-slate-200"),onClick:()=>t(o),children:[(0,i.jsx)(l,{...E}),(0,i.jsx)("div",{className:"text-xs select-none",children:n+1})]},o)})})};var P=r(2422),z=r(2501);let C=(e,t)=>{let r=()=>{!(e.some(e=>!e.current)||t.some(e=>!e.current))&&e.forEach((e,r)=>{var n,l,i;if(!e.current)return;let{innerWidth:o,innerHeight:c,devicePixelRatio:a}=window;e.current.width=o,e.current.height=c,e.current.style.width=o+"px",e.current.style.height=c+"px",e.current.width=a*o,e.current.height=a*c,null===(i=t[r])||void 0===i||null===(l=i.current)||void 0===l||null===(n=l.scale)||void 0===n||n.call(l,a,a)})};(0,P.Z)(r),(0,z.Z)("resize",r,{target:window})};var N=r(5271);let A=()=>{let e=(0,N.useRef)(null),t=(0,N.useRef)(null),r=(0,N.useRef)(null),n=(0,N.useRef)(null);return(0,P.Z)(()=>{e.current&&t.current&&(r.current=e.current.getContext("2d"),n.current=t.current.getContext("2d"))}),{staticCanvasRef:e,activeCanvasRef:t,staticCanvasCtx:r,activeCanvasCtx:n}},U=()=>{let[e,t]=(0,N.useState)(null),[r,n]=(0,N.useState)({x:0,y:0});return(0,z.Z)("mousedown",e=>{let{pageX:r,pageY:n}=e;t({x:r,y:n})},{target:document}),(0,z.Z)("mousemove",e=>{let{pageX:t,pageY:r}=e;n({x:t,y:r})},{target:document}),(0,z.Z)("mouseup",()=>{t(null)},{target:document}),{startCoordinate:e,moveCoordinate:r}};var D=r(2170),W=r(8988);let F=(e,t)=>{if(t.type===c.text)return;let[r,n,l,i]=eh(t);B(e,r),B(e,n),t.type!==c.arrow&&(B(e,l),B(e,i))},L=(e,t,r)=>{let{x:n,y:l,width:i,height:o,type:c}=t,a=i>0?3:-3,d=o>0?3:-3,u=n-a,s=n+i+a,h=l-d,f=l+o+d;e.strokeStyle="rgb(105, 101, 219)",e.beginPath(),(null==r?void 0:r.isDashLine)&&e.setLineDash(v),e.moveTo(u,h),e.lineTo(s,h),e.lineTo(s,f),e.lineTo(u,f),e.closePath(),e.stroke(),e.setLineDash([]),e.beginPath(),(null==r?void 0:r.withoutResizeRect)||F(e,{x:n,y:l,width:i,height:o,type:c}),e.stroke(),e.strokeStyle="#000"},B=(e,t)=>{let{x:r,y:n,width:l,height:i}=t;e.moveTo(r,n),e.lineTo(r+l,n),e.lineTo(r+l,n+i),e.lineTo(r,n+i),e.closePath()},H=(e,t)=>{let{x:r,y:n,width:l,height:i}=t,o=r+l/2,c=n+i/2,a=Math.abs(l/2),d=Math.abs(i/2),u=a>d?1/a:1/d;e.moveTo(o+a,c);for(let t=0;t<2*Math.PI;t+=u)e.lineTo(o+a*Math.cos(t),c+d*Math.sin(t));e.closePath()},J=(e,t)=>{let{x:r,y:n,width:l,height:i}=t;e.moveTo(r+l/2,n+i),e.lineTo(r+l,n+i/2),e.lineTo(r+l/2,n),e.lineTo(r,n+i/2),e.closePath()},K=(e,t)=>{let{x:r,y:n,width:l,height:i}=t;e.save(),e.fillStyle="rgb(224, 223, 255)",e.fillRect(r,n,l,i),e.restore()},X=(e,t)=>{let{x:r,y:n,width:l,height:i}=t,o=Math.min(Math.pow(l*l+i*i,.5)/2,30),c=i<0?-o:o,a=Math.floor(180/(Math.PI/Math.atan(l/i))),d=a+30,u=a-30,s=r+l,h=n+i,f=s-c*Math.sin(Math.PI*d/180),p=h-c*Math.cos(Math.PI*d/180),y=s-c*Math.sin(Math.PI*u/180),g=h-c*Math.cos(Math.PI*u/180);e.moveTo(r,n),e.lineTo(s,h),e.lineTo(f,p),e.moveTo(s,h),e.lineTo(y,g)},$=(e,t)=>{let{x:r,y:n,content:l}=t;(null==l?void 0:l.trim())&&(e.textBaseline="bottom",e.font=`15px  ${g}`,el(l).forEach((t,l)=>{e.fillText(t,r,n+15*(l+1))}))},q=(e,t)=>{switch(t.type){case c.selection:K(e,t);return;case c.rectangle:B(e,t);return;case c.circle:H(e,t);return;case c.diamond:J(e,t);return;case c.arrow:X(e,t);return;case c.text:$(e,t);return}},G=(e,t)=>{e.beginPath(),t.forEach(t=>q(e,t)),e.stroke()},Y=(e,t)=>{let r=t.filter(e=>e.selected),n=r.length>1;if(n){let[t,n,l,i]=es(r);L(e,{x:t,y:l,width:n-t,height:i-l,type:c.selection},{isDashLine:!0})}r.forEach(t=>{L(e,t,{withoutResizeRect:n})})},Q=(e,t)=>{e.clearRect(0,0,window.innerWidth,window.innerHeight),Y(e,t),G(e,t)},V=()=>document.querySelector("textarea")?null:document.createElement("textarea"),ee=(e,t,r,n)=>{let{oninput:l,onChange:i}=n;e.onkeydown=e=>{e.stopPropagation()},e.oninput=()=>{e.style.height=e.scrollHeight+"px",null==l||l()},e.onblur=n=>{i(n.target.value,t,r),document.body.removeChild(e)},setTimeout(()=>{e.focus()})},et=(e,t)=>Object.assign(e.style,{position:"absolute",margin:0,padding:0,border:0,outline:0,background:"transparent",resize:"none",fontSize:"15px",lineHeight:"1em",fontFamily:g,overflow:"hidden",...t}),er=(e,t,r)=>{let{x:n,y:l}=e;return t?{top:t.y+t.height/2-9+"px",left:t.x-(t.width<0?t.width:0)+"px",width:t.width+"px",height:"18px",textAlign:"center"}:{top:((null==r?void 0:r.y)??l)+"px",left:((null==r?void 0:r.x)??n)+"px",width:`${window.innerWidth-n}px`,whiteSpace:"nowrap"}},en=(e,t,r,n)=>{let{x:l,y:i}=e,o=V();o&&(n&&n.content&&(o.value=n.content,o.setSelectionRange(0,n.content.length)),et(o,er({x:l,y:i},r,n)),ee(o,r,n??null,{onChange:t}),document.body.appendChild(o))},el=e=>e.replace(/\r\n?/g,"\n").split("\n"),ei=(e,t)=>Math.max(e,e+t),eo=(e,t)=>Math.min(e,e+t),ec=e=>[eo(e.x,e.width),ei(e.x,e.width),eo(e.y,e.height),ei(e.y,e.height)],ea=e=>e>5?e-5:0,ed=e=>e+5,eu=(e,t,r)=>e>=ea(t)&&e<=ed(r??t),es=e=>{let t=-1/0,r=-1/0,n=1/0,l=1/0;return e.forEach(e=>{let[i,o,c,a]=ec(e);o>t&&(t=o),i<n&&(n=i),a>r&&(r=a),c<l&&(l=c)}),[n,t,l,r]},eh=e=>{let{x:t,y:r,width:n,height:l}=e,i=n>0?3:-3,o=l>0?3:-3,c=t-i,a=t+n+i,d=r-o,u=r+l+o,s=n>0?8:-8,h=l>0?8:-8,f=(e,t,r,n)=>({x:e,y:t,width:r,height:n});return[f(c,d,-s,-h),f(a,u,s,h),f(a,d,s,-h),f(c,u,-s,h)]},ef=e=>e.width>0&&e.height>0||e.type===c.arrow?e:{...e,x:e.width>0?e.x:e.x+e.width,y:e.height>0?e.y:e.y+e.height,width:e.width>0?e.width:-e.width,height:e.height>0?e.height:-e.height},ep=e=>{let t=[];return e.forEach(r=>{if(r.selected){var n;t.push(r),null===(n=r.boundingElements)||void 0===n||n.forEach(r=>{let n=e.find(e=>r.id===e.id);n&&t.push(n)})}}),t},ey=(e,t,r,n)=>Math.pow(Math.pow(Math.abs(e-t),2)+Math.pow(Math.abs(r-n),2),.5),eg=(e,t)=>{let{x:r,y:n}=e,l=t.filter(e=>e.selected);if(l.length){if(l.length>1){let[e,t,i,o]=es(l);if(eu(r,e,t)&&eu(n,i,o))return l}else{let[e,t,i,o]=ec(l[0]);if(eu(r,e,t)&&eu(n,i,o))return l[0]}}for(let e of t){let[t,l,i,o]=ec(e);if(e.type===c.text&&eu(r,t,l)&&eu(n,i,o)||e.type===c.rectangle&&((eu(r,t)||eu(r,l))&&eu(n,i,o)||(eu(n,i)||eu(n,o))&&eu(r,t,l)))return e;if(e.type===c.circle){let t=e.width/2,l=e.height/2,i=Math.pow(r-(e.x+t),2)/Math.pow(t,2)+Math.pow(n-(e.y+l),2)/Math.pow(l,2);if(i<=1.2&&i>=.9)return e}if(e.type===c.diamond){let t=e.width*e.height,l=Math.abs(r-(e.x+e.width/2)),i=Math.abs(n-(e.y+e.height/2)),o=(ed(l)*e.height+ed(i)*e.width)*2,c=(ea(l)*e.height+ea(i)*e.width)*2;if(o>=t&&c<=t)return e}if(e.type===c.arrow){let c=Math.round(ey(t,l,i,o)),a=Math.round(ey(r,e.x,n,e.y)+ey(r,e.x+e.width,n,e.y+e.height));if(a>=c-2.5&&a<=c+2.5)return e}}return null},em=(e,t)=>{let{x:r,y:n}=e,l=null;return t.forEach(e=>{if(!x.includes(e.type))return;let[t,i]=[e.x+e.width/2,e.y+e.height/2];r<=t+10&&r>=t-10&&n<=i+10&&n>=i-10&&(l?e.width<l.width&&(l=e):l=e)}),l},ev=(e,t)=>{let{x:r,y:n}=e;return t.find(e=>e.type===c.text&&r>=e.x&&n>=e.y&&r<=e.x+e.width&&n<=e.y+e.height)},ex=(e,t)=>{let r=t.filter(e=>e.selected);if(!r.length)return null;let n=(t,r)=>{let{length:n}=t;for(let l=0;l<n;l++){let{x:n,width:i,y:o,height:c}=t[l];if(eu(e.x,eo(n,i),ei(n,i))&&eu(e.y,eo(o,c),ei(o,c)))return{cursorConfig:i*c>0?a.nwseResize:a.neswResize,position:[0,2].includes(l)===r.height>0?"top":"bottom"}}return null},l=null;if(1===r.length){let e=r[0];l=n(eh(e),e)}else{let[e,t,i,o]=es(r),c={x:e,y:i,width:t-e,height:o-i};l=n(eh(c),c)}return l},ew=(0,r(7977).Z)(),eb=e=>{let t=new Blob(["\uFEFF"+e],{type:"text/json"});return URL.createObjectURL(t)},eR=(e,t)=>{let r=document.createElement("a");r.download=t,r.href=e,document.body.appendChild(r),r.click(),document.body.removeChild(r)};var eM=r(8296),eE=r(6541),e_=r(720),eZ=r(1729),ej=r(6103),ek=new WeakMap,eO=new WeakMap,eT=new WeakSet,eI=new WeakSet,eS=new WeakSet,eP=new WeakSet;function ez(e){console.log("history record data:::",e),(0,eM._)(this,eO).push(e),(0,e_._)(this,ek,[])}function eC(e,t){var r;let n=[...(null==t?void 0:null===(r=t.keys)||void 0===r?void 0:r.call(t))||[]];n.length&&(e.value=e.value.filter(e=>!n.includes(e.id)))}function eN(e,t,r){null==r||r.forEach(r=>{var n;e.value.push({...r[t],selected:!(null===(n=r[t])||void 0===n?void 0:n.containerId)})})}function eA(e,t,r){(null==r?void 0:r.size)&&(e.value=e.value.map(e=>{let n=r.get(e.id);if(!n)return e;let l=n[t];return{...e,...l,selected:(null==l?void 0:l.selected)??!e.containerId}}))}let eU=new class{redo(e){let t=(0,eM._)(this,ek).pop();if(!t)return null;console.log("redoRecord:::",t),(0,eM._)(this,eO).push(t);let{added:r,removed:n,updated:l}=t,i={value:e.map(e=>({...e,selected:!1}))};return(0,eZ._)(this,eS,eN).call(this,i,"payload",r),(0,eZ._)(this,eI,eC).call(this,i,n),(0,eZ._)(this,eP,eA).call(this,i,"payload",l),i.value}undo(e){let t=(0,eM._)(this,eO).pop();if(!t)return null;console.log("undoRecord:::",t),(0,eM._)(this,ek).push(t);let{added:r,removed:n,updated:l}=t,i={value:e.map(e=>({...e,selected:!1}))};return(0,eZ._)(this,eS,eN).call(this,i,"deleted",n),(0,eZ._)(this,eI,eC).call(this,i,r),(0,eZ._)(this,eP,eA).call(this,i,"deleted",l),i.value}collectRemovedRecord(e){let t=new Map;e.forEach(e=>{t.set(e.id,{deleted:e})}),(0,eZ._)(this,eT,ez).call(this,{removed:t})}transformUpdatedRecordData(e){let t=new Map;return e.forEach(e=>{let r=t.get(e.id);r?t.set(e.id,{payload:{...r.payload,...e.value.payload},deleted:{...r.deleted,...e.value.deleted}}):t.set(e.id,e.value)}),t}collectAddedRecord(e,t){let r=new Map;e.forEach(e=>{r.set(e.id,{payload:e})}),(0,eZ._)(this,eT,ez).call(this,{added:r,updated:t?this.transformUpdatedRecordData(t):void 0})}collectUpdatedRecord(e){(0,eZ._)(this,eT,ez).call(this,{updated:this.transformUpdatedRecordData(e)})}constructor(){(0,ej._)(this,eT),(0,ej._)(this,eI),(0,ej._)(this,eS),(0,ej._)(this,eP),(0,eE._)(this,ek,{writable:!0,value:[]}),(0,eE._)(this,eO,{writable:!0,value:[]})}},eD=e=>{let{staticDrawData:t,setStaticDrawData:r}=e,n=(0,D.Z)(()=>{eU.collectRemovedRecord(t),r([])}),l=(0,D.Z)(()=>{let e=document.createElement("input");e.type="file",e.style.display="none",document.body.appendChild(e),e.click(),e.onchange=t=>{let n=t.target.files[0],l=new FileReader;l.onload=e=>{try{let t=JSON.parse(e.target.result);eU.collectAddedRecord(t),r(t)}catch(e){}},l.readAsText(n),document.body.removeChild(e)}}),i=(0,D.Z)(()=>{if(!t.length){W.ZP.info("暂无内容");return}eR(eb(JSON.stringify(t)),m)}),o=(0,D.Z)(()=>{if(!t.length){W.ZP.info("暂无内容");return}let e=document.createElement("canvas"),r=e.getContext("2d");if(!r)return;let[n,l,i,o]=es(t),c=l-n+30,a=o-i+30;e.width=c,e.height=a,r.save(),r.fillStyle="#fff",r.fillRect(0,0,c,a),r.restore(),Q(r,t.map(e=>({...e,x:e.x-n+15,y:e.y-i+15}))),eR(e.toDataURL(),m)});(0,P.Z)(()=>{ew.on(w,n),ew.on(R,i),ew.on(M,o),ew.on(b,l)})};var eW=r(6348);let eF=e=>{let{staticDrawData:t,setStaticDrawData:r,moveCoordinate:n}=e;(0,T.Z)(["meta.a"],()=>r(e=>e.map(e=>({...e,selected:!e.containerId})))),(0,T.Z)(["Backspace"],()=>{let e=ep(t);eU.collectRemovedRecord(e),r(t=>t.filter(t=>!e.some(e=>e.id===t.id)))});let l=(0,N.useRef)([]);(0,T.Z)(["meta.c"],()=>{let e=ep(t);l.current=e,e.length&&W.ZP.success("复制成功")}),(0,T.Z)(["meta.v"],()=>{if(!l.current.length)return;let[e,t,i,o]=es(l.current),c=n.x-(e+t)/2,a=n.y-(i+o)/2,d={},u=l.current.map(e=>{let t=(0,eW.x0)();return d[e.id]=t,{...e,id:t,x:e.x+c,y:e.y+a,selected:!e.containerId}}).map(e=>{var t;return{...e,containerId:e.containerId?d[e.containerId]:void 0,boundingElements:null===(t=e.boundingElements)||void 0===t?void 0:t.map(e=>({...e,id:d[e.id]}))}});eU.collectAddedRecord(u),r(e=>[...e.map(e=>({...e,selected:!1})),...u])}),(0,T.Z)(["meta.z"],e=>{e.preventDefault();let n=eU.undo(t);n&&r(n)}),(0,T.Z)(["meta.y"],e=>{e.preventDefault();let n=eU.redo(t);n&&r(n)})},eL=e=>{let{staticDrawData:t,activeDrawData:r,staticCanvasCtx:n,activeCanvasCtx:l}=e;(0,I.Z)(()=>{l.current&&Q(l.current,r)},[r]),(0,N.useEffect)(()=>{n.current&&(Q(n.current,t),localStorage.setItem(m,JSON.stringify(t)))},[t]),(0,z.Z)("resize",()=>{l.current&&Q(l.current,r),n.current&&Q(n.current,t)},{target:window})};var eB=r(7866),eH=r(9253);let eJ=e=>{let{startCoordinate:t,moveCoordinate:r,activeDrawData:n,staticDrawData:l,staticCanvasCtx:i,setStaticDrawData:o,setActiveDrawData:d}=e,[u,s]=(0,_.KO)(j),[h,f]=(0,_.KO)(Z),p=(0,N.useRef)(null),y=(0,N.useRef)(null),g=(e,r,n)=>{if(e.trim()&&(t||n)){let l=el(e),a=l.filter((e,t)=>!!e.trim()||t!==l.length-1),d=0;a.forEach(e=>{if(i.current){let{width:t}=i.current.measureText(e);t>d&&(d=t)}});let u=15*a.length,s=r?{x:r.x+(r.width-d)/2,y:r.y+r.height/2-u/2}:n?{x:n.x,y:n.y}:t,h=n?n.id:(0,eW.x0)(),f={id:h,type:c.text,content:e,width:d,selected:!1,height:u,...s,...r?{containerId:r.id}:{}},p=[],y=[...(null==r?void 0:r.boundingElements)||[],{id:h,type:c.text}];n?(p.push({id:h,value:{deleted:{content:n.content},payload:{content:f.content}}}),eU.collectUpdatedRecord(p)):(r&&p.push({id:r.id,value:{deleted:{boundingElements:r.boundingElements},payload:{boundingElements:y}}}),eU.collectAddedRecord([f],p)),o(e=>[...r?[...e.filter(e=>e.id!==r.id),{...r,boundingElements:y}]:e,f])}},m=e=>!e.current.length&&(console.log("execute collectSelectedElements"),e.current=ep(l),!!e.current.length)&&(d(e.current),o(t=>t.filter(t=>!e.current.some(e=>e.id===t.id))),!0),v=(0,N.useRef)([]),x=()=>{v.current.length&&(eU.collectUpdatedRecord(v.current),v.current=[])},w=(e,t)=>{e.current.forEach(e=>{let r=n.find(t=>e.id===t.id);r&&v.current.push({id:e.id,value:{payload:t(r),deleted:t(e)}})})},b=(0,N.useRef)([]),R=(0,N.useRef)(),M=e=>{if(!t){let e=!1;return b.current.length&&(w(b,e=>({x:e.x,y:e.y})),o(e=>[...e,...n]),d([]),b.current=[],e=!0),x(),e}let i=eg(t,[...l,...n]);if(e&&l.find(e=>e.selected)){let e=[];o(l.map(t=>t.selected?(e.push({id:t.id,value:{payload:{selected:!1},deleted:{selected:!0}}}),{...t,selected:!1}):t)),R.current=setTimeout(()=>{eU.collectUpdatedRecord(e)})}if(u!==a.move)return!1;if(!Array.isArray(i)&&(null==i?void 0:i.selected)===!1){let e=i.containerId||i.id;return o(l.map(t=>t.id===e?(v.current.push({id:t.id,value:{payload:{selected:!0},deleted:{selected:!1}}}),{...t,selected:!0}):t)),!0}return!!m(b)||(b.current.length&&d(e=>e.map(e=>{let n=b.current.find(t=>t.id===e.id);return n?{...n,x:n.x+r.x-t.x,y:n.y+r.y-t.y}:e})),!0)},E=(0,N.useRef)([]),k=(0,N.useRef)(null),O=()=>{if(!t){let e=!1;return E.current.length&&(w(E,e=>({x:e.x,y:e.y,width:e.width,height:e.height})),o(e=>[...e,...n.map(ef)]),d([]),E.current=[],k.current=null,e=!0),x(),e}if(![a.neswResize,a.nwseResize].includes(u))return!1;if(m(E))return!0;if(E.current.length){let e=r.x-t.x,l=r.y-t.y;k.current||(k.current=es(n));let[i,o,s,h]=k.current;d(t=>(0,eH.Uy)(t,t=>{E.current.forEach(r=>{let n=t.find(e=>e.id===r.id);if(!n)return;let d=0,f=0,p=0,g=0,m=r.width/(o-i)*e,v=r.height/(h-s)*l;u===a.neswResize?"top"===y.current?(d=r.x-i,f=h-r.y,p=m,g=-v):(d=o-r.x,f=r.y-s,p=-m,g=v):u===a.nwseResize&&("top"===y.current?(d=o-r.x,f=h-r.y,p=-m,g=-v):(d=r.x-i,f=r.y-s,p=m,g=v)),n.x=r.x+d/(o-i)*e,n.y=r.y+f/(h-s)*l,n.type!==c.text&&(n.width=r.width+p,n.height=r.height+g)})}))}return!0},T=()=>{if(!t){if(p.current){if(![c.selection,c.text].includes(p.current.type)&&(Math.abs(p.current.width)>=3||Math.abs(p.current.height)>=3)){let e=ef({...p.current,selected:!0});eU.collectAddedRecord([e]),o(t=>[...t,e])}if(p.current.type===c.selection){let e=l.filter(e=>e.selected);if(e.length){let t=[];e.forEach(e=>{t.push({id:e.id,value:{payload:{selected:!0},deleted:{selected:!1}}})}),eU.collectUpdatedRecord(t)}}d([]),p.current=null,f(c.selection)}return!1}if(!p.current)return p.current={id:(0,eW.x0)(),type:h,width:0,height:0,selected:!1,...t},!0;if(p.current.width=r.x-t.x,p.current.height=r.y-t.y,d([p.current]),h===c.selection){let e=p.current;o(t=>t.map(t=>{if(t.containerId)return t;let r=eo(t.x,t.width)>=eo(e.x,e.width)&&ei(t.x,t.width)<=ei(e.x,e.width)&&eo(t.y,t.height)>=eo(e.y,e.height)&&ei(t.y,t.height)<=ei(e.y,e.height);return{...t,selected:r}}))}return!0},I=()=>{if(h===c.selection){let e=ex(r,l);if(e){s(e.cursorConfig),y.current=e.position;return}if(eg(r,l)){s(a.move);return}s(a.default)}else s(a.crosshair)},S=()=>{if(!t)return;let e=ev(t,l);if(e)en(t,g,l.find(t=>t.id===(null==e?void 0:e.containerId))??null,e),o(t=>t.filter(t=>t.id!==e.id));else{let e=em(t,l);en(t,g,e)}s(a.default),f(c.selection)};(0,eB.Z)(e=>{let t=null==e?void 0:e.includes(0);if(h===c.text&&t){S();return}if(M(t)||O()){clearTimeout(R.current);return}!T()&&I()},[t,r])},eK=(e,t)=>{let[r,n]=(0,N.useState)([]),[l,i]=(0,N.useState)(()=>{try{return JSON.parse(localStorage.getItem(m)||"[]")}catch{return[]}}),{startCoordinate:o,moveCoordinate:c}=U();eJ({startCoordinate:o,moveCoordinate:c,staticDrawData:l,activeDrawData:r,staticCanvasCtx:t,setStaticDrawData:i,setActiveDrawData:n}),eD({staticDrawData:l,setStaticDrawData:i}),eF({staticDrawData:l,setStaticDrawData:i,moveCoordinate:c}),eL({staticDrawData:l,activeDrawData:r,staticCanvasCtx:t,activeCanvasCtx:e})},eX=()=>{let e=(0,_.Dv)(j),{activeCanvasCtx:t,activeCanvasRef:r,staticCanvasCtx:n,staticCanvasRef:l}=A();return C([l,r],[n,t]),eK(t,n),(0,i.jsxs)("div",{className:"canvas_container-WF_R38",style:{cursor:e},children:[(0,i.jsx)("canvas",{ref:r}),(0,i.jsx)("canvas",{ref:l})]})};var e$=r(2307),eq=r(5082),eG=r(1397),eY=r(9551),eQ=r(8161),eV=r(4897);let e0=[{icon:e$.Z,label:"打开",key:b},{icon:eq.Z,label:"保存画布数据",key:R},{icon:eG.Z,label:"导出图片",key:M},{icon:eY.Z,label:"重置画布",key:w}],e1=()=>{let e=e0.map(e=>{let t=e.icon;return{label:(0,i.jsxs)("div",{className:"flex items-center",onClick:()=>ew.emit(e.key),children:[t?(0,i.jsx)(t,{...E,size:16,className:"mr-2"}):null,(0,i.jsx)("div",{className:"text-sm",children:e.label})]}),key:e.key}});return(0,i.jsx)("div",{className:"absolute top-3 left-3 rounded bg-slate-50 shadow p-1",children:(0,i.jsx)(eV.Z,{menu:{items:e},overlayClassName:"mt-8",trigger:["click"],children:(0,i.jsx)(eQ.Z,{...E})})})};r(7883),o.createRoot(document.getElementById("root")).render((0,i.jsx)(()=>(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(e1,{}),(0,i.jsx)(S,{}),(0,i.jsx)(eX,{})]}),{}))}},t={};function r(n){var l=t[n];if(void 0!==l)return l.exports;var i=t[n]={exports:{}};return e[n](i,i.exports,r),i.exports}r.m=e,r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,{a:t}),t},(()=>{var e,t=Object.getPrototypeOf?function(e){return Object.getPrototypeOf(e)}:function(e){return e.__proto__};r.t=function(n,l){if(1&l&&(n=this(n)),8&l||"object"==typeof n&&n&&(4&l&&n.__esModule||16&l&&"function"==typeof n.then))return n;var i=Object.create(null);r.r(i);var o={};e=e||[null,t({}),t([]),t(t)];for(var c=2&l&&n;"object"==typeof c&&!~e.indexOf(c);c=t(c))Object.getOwnPropertyNames(c).forEach(function(e){o[e]=function(){return n[e]}});return o.default=function(){return n},r.d(i,o),i}})(),r.d=function(e,t){for(var n in t)r.o(t,n)&&!r.o(e,n)&&Object.defineProperty(e,n,{enumerable:!0,get:t[n]})},r.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||Function("return this")()}catch(e){if("object"==typeof window)return window}}(),r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},(()=>{var e=[];r.O=function(t,n,l,i){if(n){i=i||0;for(var o=e.length;o>0&&e[o-1][2]>i;o--)e[o]=e[o-1];e[o]=[n,l,i];return}for(var c=1/0,o=0;o<e.length;o++){for(var n=e[o][0],l=e[o][1],i=e[o][2],a=!0,d=0;d<n.length;d++)(!1&i||c>=i)&&Object.keys(r.O).every(function(e){return r.O[e](n[d])})?n.splice(d--,1):(a=!1,i<c&&(c=i));if(a){e.splice(o--,1);var u=l();void 0!==u&&(t=u)}}return t}})(),r.rv=function(){return"1.2.2"},(()=>{var e={980:0};r.O.j=function(t){return 0===e[t]};var t=function(t,n){var l,i,o=n[0],c=n[1],a=n[2],d=0;if(o.some(function(t){return 0!==e[t]})){for(l in c)r.o(c,l)&&(r.m[l]=c[l]);if(a)var u=a(r)}for(t&&t(n);d<o.length;d++)i=o[d],r.o(e,i)&&e[i]&&e[i][0](),e[i]=0;return r.O(u)},n=self.webpackChunkspicy_chicken_draw=self.webpackChunkspicy_chicken_draw||[];n.forEach(t.bind(null,0)),n.push=t.bind(null,n.push.bind(n))})(),r.ruid="bundler=rspack@1.2.2";var n=r.O(void 0,["361","495"],function(){return r(9746)});n=r.O(n)})();
/* Offline geography, optional road geometry. No network or device-location access. */
window.JourneyMap=(()=>{
 const ns='http://www.w3.org/2000/svg';
 const node=(tag,attrs={},text)=>{const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text)n.textContent=text;return n};
 function valid(points){return Array.isArray(points)&&points.length>1&&points.length<30000&&points.every(p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90)}
 function length(a,b){const rad=Math.PI/180,x=(b[0]-a[0])*Math.cos((a[1]+b[1])/2*rad),y=b[1]-a[1];return Math.hypot(x,y)}
 function pointAlong(points,fraction){const lengths=points.slice(1).map((p,i)=>length(points[i],p));let remaining=lengths.reduce((a,b)=>a+b,0)*Math.max(0,Math.min(1,fraction));for(let i=0;i<lengths.length;i++){if(remaining<=lengths[i]||i===lengths.length-1){const t=lengths[i]?remaining/lengths[i]:0;return points[i].map((v,k)=>v+(points[i+1][k]-v)*t)}remaining-=lengths[i]}return points[0]}
 function render(host,a,b,geometry=null,fraction=0){
  const real=valid(geometry),points=real?geometry:[[a.lon,a.lat],[b.lon,b.lat]];
  const lon0=Math.min(-126,a.lon-4,b.lon-4),lon1=Math.max(-65,a.lon+4,b.lon+4),lat0=Math.min(24,a.lat-3,b.lat-3),lat1=Math.max(50,a.lat+3,b.lat+3);
  const project=p=>[24+(p[0]-lon0)/(lon1-lon0)*852,446-(p[1]-lat0)/(lat1-lat0)*422];
  const path=ring=>ring.map((p,i)=>(i?'L':'M')+project(p).map(v=>v.toFixed(1)).join(',')).join(' ');
  const svg=node('svg',{viewBox:'0 0 900 470',role:'img','aria-label':`United States journey map: ${a.n} to ${b.n}. ${real?'Road route':'Estimated endpoint connection'}.`});
  svg.append(node('rect',{width:900,height:470,fill:'#0c1b27'}));
  for(const f of window.LWH_GEOGRAPHY){const polygons=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;for(const polygon of polygons)svg.append(node('path',{d:polygon.map(r=>path(r)+' Z').join(' '),fill:f.name==='United States of America'?'#34594f':'#22383a',stroke:'#6b897e','stroke-width':1,'fill-rule':'evenodd'}))}
  const line=node('path',{d:path(points),fill:'none',stroke:'#f2bc65','stroke-width':4,'stroke-linejoin':'round'});if(!real)line.setAttribute('stroke-dasharray','8 8');svg.append(line);
  for(const [city,label,color] of [[a,'START','#a3d8b3'],[b,'DESTINATION','#f2bc65']]){const [x,y]=project([city.lon,city.lat]);svg.append(node('circle',{cx:x,cy:y,r:7,fill:color,stroke:'#081218','stroke-width':3}));const tx=Math.max(12,Math.min(720,x+12)),ty=label==='START'?Math.min(447,y+32):Math.max(25,y-18);svg.append(node('text',{x:tx,y:ty,fill:'#fff4d4','font-size':25,'font-family':'monospace','paint-order':'stroke',stroke:'#09151c','stroke-width':4},label));}
  if(fraction>0){const [x,y]=project(pointAlong(points,fraction));svg.append(node('circle',{cx:x,cy:y,r:9,fill:'#f5f2d8',stroke:'#0b141a','stroke-width':3}));svg.append(node('rect',{x:12,y:417,width:280,height:43,fill:'#0c1b27',opacity:.92}));svg.append(node('circle',{cx:32,cy:440,r:9,fill:'#f5f2d8',stroke:'#0b141a','stroke-width':3}));svg.append(node('text',{x:52,y:448,fill:'#ffffff','font-size':25,'font-family':'monospace'},'YOUR POSITION'));}
  host.replaceChildren(svg);return real;
 }
 return {render,valid,pointAlong};
})();

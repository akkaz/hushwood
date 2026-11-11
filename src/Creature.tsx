export const creatures=['fern','ember','moss','pebble','cloud','owl'] as const;
const colors:Record<string,[string,string]>={fern:['#bdd964','#688c3d'],ember:['#eea073','#ac5338'],moss:['#86b49a','#45775f'],pebble:['#a4a8bc','#666c87'],cloud:['#d2c4e0','#9b7db8'],owl:['#d2b47d','#92723d']};
export function Creature({kind='fern',mood='quiet',stage=1,small=false}:{kind?:string;mood?:string;stage?:number;small?:boolean}) {
 const [fill,shade]=colors[kind]??colors.fern;
 return <svg className={`creature ${mood} ${small?'small':''}`} viewBox="0 0 320 320" role="img" aria-label={kind}>
 <ellipse cx="160" cy="286" rx="88" ry="12" fill="#173b2c" opacity=".12"/>
 <g className="creature-body">
 {kind==='owl'?<><path d="M78 140 L70 53 L136 104Z M185 104 L251 53 L243 144Z" fill={shade}/></>:kind==='cloud'?<><circle cx="111" cy="112" r="43" fill={fill}/><circle cx="175" cy="91" r="48" fill={fill}/><circle cx="222" cy="126" r="42" fill={fill}/></>:kind==='pebble'?<path d="M104 98 Q160 30 215 104" fill={shade}/>:<><path className="leaf" d={kind==='ember'?'M144 111 Q102 72 147 36 Q141 68 178 86 L173 116Z':'M158 105 Q104 84 119 39 Q163 42 169 97Z'} fill={shade}/><path d="M166 103 Q170 61 212 61 Q216 101 166 111Z" fill={fill}/></>}
 <path d="M85 203 Q47 178 55 209 Q58 237 91 236 M231 203 Q273 176 267 209 Q264 239 231 236" fill={shade}/>
 <rect x="82" y="93" width="157" height="183" rx={kind==='pebble'?61:75} fill={fill}/>
 <ellipse cx="160" cy="215" rx="52" ry="44" fill="#fff6df" opacity=".6"/>
 <ellipse cx="111" cy="271" rx="25" ry="13" fill={shade}/><ellipse cx="210" cy="271" rx="25" ry="13" fill={shade}/>
 {mood==='sleep'?<g fill="none" stroke="#193b2c" strokeWidth="7" strokeLinecap="round"><path d="M114 166 Q124 174 134 166 M186 166 Q196 174 206 166"/></g>:<g className="eyes" fill="#193b2c"><ellipse cx="124" cy="162" rx="7" ry="10"/><ellipse cx="196" cy="162" rx="7" ry="10"/><circle cx="126" cy="159" r="2" fill="white"/><circle cx="198" cy="159" r="2" fill="white"/></g>}
 <g fill="#d77963" opacity=".5"><ellipse cx="107" cy="182" rx="12" ry="7"/><ellipse cx="213" cy="182" rx="12" ry="7"/></g>
 {mood==='noisy'?<ellipse cx="160" cy="189" rx="7" ry="10" fill="#193b2c"/>:<path d="M148 184 Q160 198 172 184" stroke="#193b2c" fill="none" strokeWidth="5" strokeLinecap="round"/>}
 {stage>=2&&<path d="M138 223 L160 210 L182 223 L160 240Z" fill={shade}/>}
 {stage>=3&&<g fill="#e5ac3e"><path d="M130 90 L125 66 L148 78 L160 53 L173 78 L195 66 L190 90Z"/><circle cx="160" cy="67" r="5"/></g>}
 </g></svg>
}

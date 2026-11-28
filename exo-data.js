// Cadenzo · poses des exercices (partie 1 : renforcement). Angles : voir exo.js.
(function(){
var A=EXO.add, S0={anc:["l2",58],H:"auto",t:180,a:[0,0],b:[0,0],l:[0,0,90],m:[0,0,90]};
A("squat",{n:"Squat",l1:"Debout",l2:"Descente",A:S0,
 B:{anc:["l2",58],H:"auto",t:150,a:[90,90],b:[90,90],l:[90,-24,90],m:[90,-24,90],hot:["thigh","glute"],ar:[[34,40,34,56,0]]}});
A("lunge",{n:"Fente arrière",l1:"Debout",l2:"Fente",A:S0,
 B:{anc:["l2",64],H:"auto",t:180,a:[0,0],b:[0,0],l:[88,0,90],m:[-22,-103,20],hot:["thigh","glute"],ar:[[46,44,46,58,0]]}});
A("lungefwd",{n:"Fente avant",l1:"Debout",l2:"Pas en avant",A:S0,
 B:{anc:["m3",30],H:"auto",t:180,a:[0,0],b:[0,0],l:[88,0,90],m:[-22,-103,20],hot:["thigh","glute"],cont:["l"],ar:[[34,60,56,52,-4]]}});
A("bridge",{n:"Pont fessier",l1:"Allongé",l2:"Bassin haut",
 A:{anc:["l2",78],H:"auto",t:-90,hd:-90,a:[90,90],b:[90,90],l:[150,"g+",90],m:[150,"g+",90]},
 B:{anc:["l2",78],H:11,t:-62,hd:-90,a:[88,88],b:[88,88],l:[118,0,90],m:[118,0,90],hot:["glute","thigh"],ar:[[46,48,46,34,0]]}});
A("bridge1",{n:"Pont une jambe",l1:"Allongé",l2:"Bassin haut",
 A:{anc:["l2",78],H:3,t:-90,hd:-90,a:[90,90],b:[90,90],l:[150,"g+",90],m:[128,128,150]},
 B:{anc:["l2",78],H:11,t:-62,hd:-90,a:[88,88],b:[88,88],l:[118,0,90],m:[118,118,150],hot:["glute","thigh"],ar:[[46,48,46,34,0]]}});
A("hamslide",{n:"Ischios glissés",l1:"Pont, talons près",l2:"Jambes glissent",
 A:{anc:["l2",78],H:11,t:-62,hd:-90,a:[88,88],b:[88,88],l:[118,0,90],m:[118,0,90],hot:["thigh"],props:[["towel",72,14]]},
 B:{anc:["hip",64.8],H:11,t:-62,hd:-90,a:[88,88],b:[88,88],l:[74,74,90],m:[74,74,90],hot:["thigh"],props:[["towel",72,30]],ar:[[84,62,96,62,0]]}});
A("plank",{n:"Planche",l1:"Corps aligné",
 A:{H:"auto",cont:["l"],anc:["a2",86],t:102,hd:104,a:[0,90],b:[0,90],l:[-78,-78,20],m:[-78,-78,20],hot:["torso"]}});
A("plankTap",{n:"Planche, toucher d’épaule",l1:"Position haute",l2:"Main à l’épaule",
 A:{H:14.8,anc:["a2",82],t:104.4,hd:104,a:[0,0],b:[0,0],l:[-75.6,-75.6,20],m:[-75.6,-75.6,20],hot:["torso"]},
 B:{H:14.8,anc:["a2",82],t:104.4,hd:104,a:[0,0],b:[75,215],l:[-75.6,-75.6,20],m:[-75.6,-75.6,20],hot:["torso"],ar:[[88,40,80,32,-3]]}});
A("climber",{n:"Mountain climbers",l1:"Genou droit",l2:"Genou gauche",
 A:{H:14.8,anc:["a2",82],t:104.4,hd:104,a:[0,0],b:[0,0],l:[-75.6,-75.6,20],m:[63,"g-",90],hot:["thigh"]},
 B:{H:14.8,anc:["a2",82],t:104.4,hd:104,a:[0,0],b:[0,0],l:[63,"g-",90],m:[-75.6,-75.6,20],hot:["thigh"]}});
A("sideplank",{n:"Gainage latéral",l1:"Hanche basse",l2:"Hanche haute",front:true,
 A:{t:96,hd:96,H:8,anc:["a2",82],a:[0,90],b:[170,170],l:[-84,-84,-60],m:[-84,-84,-60],hot:["torso"]},
 B:{t:102,hd:102,H:14,anc:["a2",82],a:[0,90],b:[170,170],l:[-78,-78,-60],m:[-78,-78,-60],hot:["torso"],ar:[[40,40,40,28,0]]}});
A("sideplankleg",{n:"Gainage latéral, levée de jambe",l1:"Hanche haute",l2:"Jambe levée",front:true,
 A:{t:102,hd:102,H:14,anc:["a2",82],a:[0,90],b:[170,170],l:[-78,-78,-60],m:[-78,-78,-60],hot:["torso"]},
 B:{t:102,hd:102,H:14,anc:["a2",82],a:[0,90],b:[170,170],l:[-78,-78,-60],m:[-104,-104,-60],hot:["torso","thighF"],ar:[[30,30,24,40,-3]]}});
A("wallsit",{n:"Chaise murale",l1:"Dos au mur",l2:"Position chaise",
 A:{anc:["l2",58],H:"auto",t:180,a:[0,0],b:[0,0],l:[0,0,90],m:[0,0,90],props:[["wall",50]]},
 B:{anc:["l2",70],H:"auto",t:180,a:[35,80],b:[35,80],l:[90,0,90],m:[90,0,90],hot:["thigh"],props:[["wall",50]]}});
A("sidelunge",{n:"Fente latérale",l1:"Debout",l2:"Fente latérale",front:true,
 A:{x:60,H:33,t:180,a:[20,120],b:[-20,-120],l:[0,0,90],m:[0,0,90]},
 B:{x:60,H:"auto",t:180,a:[20,120],b:[-20,-120],l:[52,0,90],m:[-38,-38,90],hot:["thigh","glute"],ar:[[78,60,90,60,0]]}});
A("birddog",{n:"Bird dog",l1:"Quatre pattes",l2:"Bras + jambe tendus",
 A:{x:44,H:17.5,t:90,hd:95,a:[0,0],b:[0,0],l:[0,-90,-90],m:[0,-90,-90],hot:["back"]},
 B:{x:44,H:17.5,t:90,hd:95,a:[0,0],b:[90,90],l:[-90,-90,0],m:[0,-90,-90],hot:["back"],ar:[[90,44,102,44,0],[16,60,6,60,0]]}});
A("stepup",{n:"Montée sur marche",l1:"Pied sur la marche",l2:"En haut",
 A:{x:62,H:33,t:180,a:[0,0],b:[0,0],l:[70,"g-",90],m:[-12,-12,90],sup:{l:10},hot:["thigh","glute"],props:[["step",56,36,10]],anc:["l2",70]},
 B:{x:62,H:43,t:180,a:[0,0],b:[0,0],l:[0,0,90],m:[70,6,90],sup:{l:10},hot:["thigh","glute"],props:[["step",56,36,10]],anc:["l2",70],ar:[[44,40,44,26,0]]}});
A("downstep",{n:"Descente de marche",l1:"Sur la marche",l2:"Talon vers le sol",
 A:{H:43,t:180,a:[0,0],b:[0,0],l:[0,0,90],m:[0,0,90],sup:{l:10},anc:["l2",76],props:[["step",58,36,10]]},
 B:{H:"auto",cont:["l"],t:180,a:[0,0],b:[0,0],l:[50,-45,90],m:[0,0,90],sup:{l:10},anc:["l2",76],hot:["thigh","glute"],props:[["step",58,36,10]],ar:[[94,56,94,70,0]]}});
A("bulgarian",{n:"Squat bulgare",l1:"Pied arrière posé",l2:"Descente",
 A:{H:"auto",anc:["l2",74],t:180,a:[0,0],b:[0,0],l:[8,-2,90],m:[-30,"g-",-80],sup:{m:14},props:[["couch",26,28]]},
 B:{H:"auto",anc:["l2",74],t:165,a:[0,0],b:[0,0],l:[84,-6,90],m:[-14,"g-",-80],sup:{m:14},hot:["thigh","glute"],props:[["couch",26,28]],ar:[[56,44,56,58,0]]}});
A("jumpsquat",{n:"Squat sauté",l1:"Réception basse",l2:"Impulsion",
 A:{anc:["l2",58],H:"auto",t:142,a:[-50,-60],b:[-50,-60],l:[90,-26,90],m:[90,-26,90],hot:["thigh","glute"]},
 B:{x:58,H:38,t:180,a:[175,175],b:[175,175],l:[0,0,28],m:[0,0,28],hot:["shin"],ar:[[30,46,30,28,0]]}});
A("jumplunge",{n:"Fente sautée",l1:"Fente basse",l2:"Changement en l’air",
 A:{anc:["l2",70],H:"auto",t:180,a:[-30,70],b:[-30,70],l:[88,0,90],m:[-22,-103,20],hot:["thigh","glute"]},
 B:{x:58,H:40,t:180,a:[30,-40],b:[-40,40],l:[40,-20,60],m:[-40,-70,40],hot:["thigh"],ar:[[28,50,28,32,0]]}});
A("pushup",{n:"Pompes sur appui",l1:"Bras tendus",l2:"Poitrine à l’appui",
 A:{H:23.7,anc:["a2",88],t:123,hd:120,a:[0,"g+"],b:[0,"g+"],l:[-57,-57,20],m:[-57,-57,20],sup:{a:17,b:17},hot:["arm"],props:[["couch",86,22]]},
 B:{H:18.5,anc:["a2",88],t:112,hd:108,a:[-50,"g+"],b:[-50,"g+"],l:[-68,-68,20],m:[-68,-68,20],sup:{a:17,b:17},hot:["arm"],props:[["couch",86,22]],ar:[[60,44,60,54,0]]}});
A("pistol",{n:"Squat vers la chaise",l1:"Debout",l2:"Assis sur la chaise",
 A:{anc:["l2",60],H:"auto",t:180,a:[90,90],b:[90,90],l:[0,0,90],m:[70,60,90],props:[["chair",30,1]]},
 B:{anc:["l2",60],H:22,t:150,a:[90,90],b:[90,90],l:[70,-22,90],m:[90,90,90],hot:["thigh","glute"],props:[["chair",30,1]],ar:[[76,40,76,56,0]]}});
A("calfstep",{n:"Mollets sur marche",l1:"Talons bas",l2:"Sur la pointe",
 A:{x:64,H:38.1,t:180,a:[0,0],b:[0,0],l:[0,0,110],m:[0,0,110],props:[["step",66,30,10]]},
 B:{x:64,H:45.1,t:180,a:[0,0],b:[0,0],l:[0,0,25],m:[0,0,25],hot:["shin"],props:[["step",66,30,10]],ar:[[36,48,36,32,0]]}});
A("skater",{n:"Sauts de patineur",l1:"Appui à droite",l2:"Saut à gauche",front:true,
 A:{x:76,H:"auto",anc:["l2",76],t:168,a:[-25,-70],b:[30,80],l:[8,-8,90],m:[-42,-62,90],hot:["thigh"]},
 B:{x:44,H:"auto",anc:["l2",44],t:192,a:[25,70],b:[-30,-80],l:[-8,8,90],m:[42,62,90],hot:["thigh"],ar:[[60,70,48,70,2]]}});
// --- exercices spécifiques coureur (route et trail) ---
A("rdl1",{n:"Charnière une jambe",l1:"Debout sur une jambe",l2:"Buste penché, jambe arrière",
 A:{anc:["l2",58],H:"auto",t:180,a:[10,10],b:[10,10],l:[6,-6,90],m:[14,-30,90],cont:["l"]},
 B:{anc:["l2",58],H:"auto",t:104,a:[0,0],b:[0,0],l:[10,-6,90],m:[-84,-84,-70],hot:["glute","thigh","back"],cont:["l"],ar:[[34,30,22,30,0]]}});
A("deadbug",{n:"Dead bug",l1:"Bras et genoux en l’air",l2:"Bras et jambe opposés",
 A:{anc:["hip",58],H:4,t:-90,hd:-90,a:[180,180],b:[180,180],l:[180,90,90],m:[180,90,90],hot:["torso"]},
 B:{anc:["hip",58],H:4,t:-90,hd:-90,a:[-120,-120],b:[180,180],l:[180,90,90],m:[104,104,90],hot:["torso"],ar:[[84,44,98,44,0]]}});
A("pogo",{n:"Sauts pogo",l1:"Appui court",l2:"Rebond sur l’avant-pied",
 A:{anc:["l2",58],H:"auto",t:180,a:[30,80],b:[30,80],l:[8,-8,90],m:[8,-8,90]},
 B:{x:58,H:42,t:180,a:[30,80],b:[30,80],l:[0,0,30],m:[0,0,30],hot:["shin","foot"],ar:[[28,38,28,24,0]]}});
A("tibraise",{n:"Tibial contre le mur",l1:"Pieds à plat",l2:"Pointes relevées",
 A:{anc:["hip",54],H:"auto",t:184,a:[10,10],b:[10,10],l:[30,30,90],m:[30,30,90],props:[["wall",47]]},
 B:{anc:["hip",54],H:"auto",t:184,a:[10,10],b:[10,10],l:[30,30,140],m:[30,30,140],hot:["shin","foot"],props:[["wall",47]],ar:[[92,70,92,58,0]]}});
A("kneedrive",{n:"Montées de genoux",l1:"Debout",l2:"Genou à hauteur de hanche",
 A:{anc:["l2",58],H:"auto",t:180,a:[-30,80],b:[40,95],l:[0,0,90],m:[0,0,90]},
 B:{anc:["l2",58],H:"auto",t:180,a:[40,95],b:[-30,80],l:[0,0,90],m:[96,6,60],hot:["thigh"],cont:["l"],ar:[[78,48,78,34,0]]}});
A("lungeknee",{n:"Fente arrière, montée de genou",l1:"Fente basse",l2:"Genou levé",
 A:{anc:["l2",64],H:"auto",t:180,a:[0,0],b:[0,0],l:[88,0,90],m:[-22,-103,20],hot:["thigh","glute"]},
 B:{anc:["l2",64],H:"auto",t:180,a:[30,90],b:[-30,80],l:[0,0,90],m:[96,6,60],hot:["thigh","glute"],cont:["l"],ar:[[78,48,78,34,0]]}});
})();

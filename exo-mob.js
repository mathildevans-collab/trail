// Cadenzo · poses des exercices de mobilité.
(function(){
var A=EXO.add, S0={anc:["l2",58],H:"auto",t:180,a:[0,0],b:[0,0],l:[0,0,90],m:[0,0,90]};
var Q={x:44,H:17.5,t:90,hd:95,a:[0,"g+"],b:[0,"g+"],l:[0,-90,-90],m:[0,-90,-90]};
function q(o){var r={};for(var k in Q)r[k]=Q[k];for(var k2 in o)r[k2]=o[k2];return r;}
A("hipflex",{n:"Fléchisseurs de hanche",l1:"Genou au sol",l2:"Bassin en avant",fo:.85,
 A:{anc:["l2",70],H:"auto",t:180,a:[40,40],b:[40,40],l:[88,0,90],m:[-6,-95,-95],cont:["l","m"],hot:["thighF"]},
 B:{anc:["l2",70],H:"auto",t:178,a:[40,40],b:[40,40],l:[96,-20,90],m:[-26,-100,-95],cont:["l","m"],hot:["thighF","glute"],ar:[[46,56,58,56,0]]}});
A("worldlunge",{n:"Fente avec rotation",fo:.85,l1:"Main au sol",l2:"Bras vers le ciel",
 A:{anc:["l2",60],H:"auto",t:112,hd:112,a:[8,8],b:[8,8],l:[88,0,90],m:[-22,-103,20],hot:["torso"]},
 B:{anc:["l2",60],H:"auto",t:112,hd:150,a:[8,8],b:[175,175],l:[88,0,90],m:[-22,-103,20],hot:["torso","armF"],ar:[[78,22,84,10,-3]]}});
A("legswing",{n:"Balancier avant-arrière",l1:"Jambe en arrière",l2:"Jambe en avant",fo:.9,
 A:{anc:["m2",52],H:33,t:178,a:[95,95],b:[95,95],l:[-35,-35,70],m:[0,0,90],hot:["thigh"],props:[["wall",84]],ar:[[28,62,20,56,2]]},
 B:{anc:["m2",52],H:33,t:182,a:[95,95],b:[95,95],l:[50,50,150],m:[0,0,90],hot:["thigh"],props:[["wall",84]],ar:[[74,62,82,56,-2]]}});
A("legswingL",{n:"Balancier latéral",l1:"Jambe vers l’ext.",l2:"Jambe croisée",front:true,
 A:{x:56,H:33,t:180,a:[45,100],b:[-45,-100],l:[0,0,90],m:[30,30,90],hot:["thighF"]},
 B:{x:56,H:33,t:180,a:[45,100],b:[-45,-100],l:[0,0,90],m:[-26,-26,90],hot:["thighF"]}});
A("adduct",{n:"Fente latérale",l1:"Jambes écartées",l2:"Poids sur une jambe",front:true,
 A:{x:60,H:33,t:180,a:[20,120],b:[-20,-120],l:[24,24,90],m:[-24,-24,90]},
 B:{x:60,H:"auto",t:180,a:[20,120],b:[-20,-120],l:[52,0,90],m:[-38,-38,90],hot:["thighF"],ar:[[78,60,90,60,0]]}});
A("ankleknee",{n:"Genou vers le mur",l1:"Pied à 8 cm du mur",l2:"Genou touche le mur",
 A:{anc:["l2",62],H:"auto",t:180,a:[95,95],b:[95,95],l:[10,-10,90],m:[-70,-70,90],props:[["wall",84]],hot:["ankle"]},
 B:{anc:["l2",62],H:"auto",t:172,a:[95,95],b:[95,95],l:[38,-18,90],m:[-70,-70,90],props:[["wall",84]],hot:["ankle","shin"],ar:[[66,50,78,50,0]]}});
A("anklecircle",{n:"Cercles de cheville",l1:"Pointe tendue",l2:"Pied tiré",
 A:{anc:["hip",30],H:26,t:176,a:[35,100],b:[35,100],l:[90,90,60],m:[84,0,90],hot:["foot","ankle"],props:[["chair",14,1]],ar:[[66,60,74,52,-6]]},
 B:{anc:["hip",30],H:26,t:176,a:[35,100],b:[35,100],l:[90,90,165],m:[84,0,90],hot:["foot","ankle"],props:[["chair",14,1]],ar:[[70,52,62,60,-6]]}});
A("heelwalk",{n:"Marche sur les talons",l1:"Debout",l2:"Pointes relevées",
 A:S0,
 B:{anc:["l2",58],H:"auto",t:180,a:[0,0],b:[0,0],l:[0,0,135],m:[0,0,135],hot:["shin"],ar:[[70,72,70,62,0]]}});
A("balance",{n:"Équilibre unipodal",l1:"Debout",l2:"Yeux fermés",
 A:{anc:["l2",58],H:"auto",t:180,a:[20,20],b:[20,20],l:[0,0,90],m:[0,0,90]},
 B:{anc:["l2",58],H:"auto",t:180,a:[20,20],b:[20,20],l:[0,0,90],m:[85,-5,90],hot:["ankle","shin"],cont:["l"]}});
A("quadstretch",{n:"Quadriceps debout",l1:"Debout",l2:"Talon vers la fesse",
 A:{anc:["m2",52],H:33,t:180,a:[10,10],b:[10,10],l:[0,0,90],m:[0,0,90],fo:.9},
 B:{anc:["m2",52],H:33,t:180,a:[50,200],b:[10,10],l:[5,-165,-90],m:[0,0,90],hot:["thigh"],fo:.9,ar:[[40,62,32,70,0]]}});
A("deepsquat",{n:"Squat profond tenu",l1:"Debout",l2:"Accroupi",
 A:S0,
 B:{anc:["l2",58],H:"auto",t:165,a:[60,140],b:[60,140],l:[110,-25,90],m:[110,-25,90],hot:["ankle","thigh"],ar:[[34,52,34,62,0]]}});
A("calfwall",{n:"Mollet, jambe tendue",l1:"Pied arrière à plat",l2:"Talon au sol",
 A:{anc:["a2",84],H:"auto",cont:["l","m"],t:160,a:[98,98],b:[98,98],l:[-18,-18,90],m:[40,-10,90],props:[["wall",86]]},
 B:{anc:["a2",84],H:"auto",cont:["l","m"],t:150,a:[102,102],b:[102,102],l:[-28,-28,90],m:[55,-12,90],props:[["wall",86]],hot:["thigh","shin"],ar:[[48,52,40,60,-3]]}});
A("calfbent",{n:"Mollet, genou fléchi",l1:"Jambe tendue",l2:"Genou fléchi",
 A:{anc:["a2",84],H:"auto",cont:["l","m"],t:150,a:[102,102],b:[102,102],l:[-28,-28,90],m:[55,-12,90],props:[["wall",86]],hot:["shin"]},
 B:{anc:["a2",84],H:"auto",cont:["l","m"],t:150,a:[102,102],b:[102,102],l:[-5,-35,90],m:[55,-12,90],props:[["wall",86]],hot:["shin","knee"],ar:[[36,66,44,62,0]]}});
A("downdog",{n:"Chien tête en bas",l1:"Jambes tendues",l2:"Pédalage",
 A:{x:44,H:22.3,t:40,hd:25,a:[69.5,69.5],b:[69.5,69.5],l:[-50,-50,90],m:[-50,-50,90],hot:["thigh","shin"],ar:[[40,48,34,38,0]]},
 B:{x:44,H:22.3,t:40,hd:25,a:[69.5,69.5],b:[69.5,69.5],l:[-10,-80,90],m:[-50,-50,90],hot:["thigh","shin"]}});
A("hamstep",{n:"Ischios, jambe tendue",l1:"Talon sur marche",l2:"Dos plat, penché",
 A:{anc:["m2",42],H:33,t:180,a:[10,10],b:[10,10],l:[76,76,170],m:[0,0,90],props:[["step",62,22,26]],hot:["thigh"],fo:.9},
 B:{anc:["m2",42],H:33,t:140,a:[110,110],b:[110,110],l:[76,76,170],m:[0,0,90],props:[["step",62,22,26]],hot:["thigh"],fo:.9,ar:[[50,36,62,38,0]]}});
A("hamsupine",{n:"Ischios allongé",l1:"Jambe verticale",l2:"Jambe rapprochée",
 A:{anc:["hip",64],H:3,t:-90,hd:-90,a:[140,160],b:[140,160],l:[172,172,170],m:[88,88,170],hot:["thigh"]},
 B:{anc:["hip",64],H:3,t:-90,hd:-90,a:[150,190],b:[150,190],l:[195,195,175],m:[88,88,170],hot:["thigh"],ar:[[58,36,48,38,-3]]}});
A("hinge",{n:"Charnière de hanche",l1:"Genoux souples",l2:"Hanches en arrière",
 A:{anc:["l2",58],H:"auto",t:180,a:[10,10],b:[10,10],l:[12,-12,90],m:[12,-12,90]},
 B:{anc:["l2",58],H:"auto",t:122,a:[40,40],b:[40,40],l:[12,-12,90],m:[12,-12,90],hot:["thigh","back"],ar:[[34,52,24,52,0]]}});
A("catcow",{n:"Chat-vache",l1:"Dos creux",l2:"Dos rond",
 A:q({sp:[100,80],hd:60,hot:["torso"],ar:[[44,54,44,64,0]]}),
 B:q({sp:[75,105],hd:135,hot:["torso"],ar:[[44,54,44,44,0]]})});
A("pelvictilt",{n:"Bascule du bassin",l1:"Bas du dos creusé",l2:"Bas du dos au sol",
 A:{anc:["l2",78],H:"auto",sp:[-98,-82],hd:-90,a:[90,90],b:[90,90],l:[150,"g+",90],m:[150,"g+",90],hot:["torso"]},
 B:{anc:["l2",78],H:"auto",sp:[-90,-90],hd:-90,a:[90,90],b:[90,90],l:[150,"g+",90],m:[150,"g+",90],hot:["torso"],ar:[[50,60,50,70,0]]}});
A("kneechest",{n:"Genoux sur la poitrine",l1:"Un genou",l2:"Les deux genoux",
 A:{anc:["hip",62],H:3,t:-90,hd:-90,a:[150,150],b:[90,90],l:[205,120,90],m:[88,"g+",90],hot:["thigh"]},
 B:{anc:["hip",62],H:3,t:-90,hd:-90,a:[150,150],b:[150,150],l:[205,120,90],m:[205,120,90],hot:["thigh"]}});
A("childpose",{n:"Posture de l’enfant",l1:"À quatre pattes",l2:"Bassin aux talons",
 A:q({hot:["back"]}),
 B:{x:50,H:8.8,t:96,sp:[92,100],hd:104,a:[92,92],b:[92,92],l:[65,-92,-92],m:[65,-92,-92],hot:["back"],ar:[[22,62,12,62,0]]}});
A("sphinx",{n:"Sphinx",l1:"Sur le ventre",l2:"Poitrine soulevée",
 A:{x:50,H:3,t:96,hd:96,a:[0,90],b:[0,90],l:[-88,-88,-90],m:[-88,-88,-90]},
 B:{x:50,H:3,sp:[100,135],hd:135,a:[0,90],b:[0,90],l:[-88,-88,-90],m:[-88,-88,-90],hot:["torso"],ar:[[60,56,60,44,0]]}});
A("openbook",{n:"Rotation du buste",l1:"Main à la nuque",l2:"Coude vers le ciel",
 A:q({a:[60,150],hot:["torso"]}),
 B:q({a:[185,235],hd:120,hot:["torso"],ar:[[70,38,78,28,-4]]})});
})();

/** Visual identities only; verification eligibility is deliberately absent. */
export const badgeVariants = ["CIRCLE","SEAL","CHECK","SHIELD","BETA","GLOSSY_CIRCLE","CRYSTAL","HOLOGRAPHIC","NEON_TICKET","LUXURY_GOLD","IRIDESCENT_GLASS","GOLD_PREMIUM","NEON_GLASS","GLOSSY_BLUE","GLOSSY_SHIELD"] as const;
export type BadgeVariant = typeof badgeVariants[number];
export const badgeStyles:readonly {id:BadgeVariant;name:string;fixedColor:boolean}[] = [
 {id:"CIRCLE",name:"Classic",fixedColor:false},{id:"SEAL",name:"Seal",fixedColor:false},{id:"CHECK",name:"Check",fixedColor:false},{id:"SHIELD",name:"Shield",fixedColor:false},{id:"BETA",name:"Premium (Beta)",fixedColor:true},
 {id:"GLOSSY_CIRCLE",name:"Glossy Blue Circle",fixedColor:true},{id:"CRYSTAL",name:"Iridescent Crystal",fixedColor:true},{id:"HOLOGRAPHIC",name:"Holographic Seal",fixedColor:true},{id:"NEON_TICKET",name:"Neon Ticket",fixedColor:true},{id:"LUXURY_GOLD",name:"Luxury Gold",fixedColor:true},{id:"IRIDESCENT_GLASS",name:"Iridescent Glass",fixedColor:true},{id:"GOLD_PREMIUM",name:"Golden Premium",fixedColor:true},{id:"NEON_GLASS",name:"Neon Glass",fixedColor:true},{id:"GLOSSY_BLUE",name:"Glossy Blue Seal",fixedColor:true},{id:"GLOSSY_SHIELD",name:"Glossy Blue Shield",fixedColor:true},
];
export const isFixedBadgeColor=(variant?:BadgeVariant)=>badgeStyles.find(style=>style.id===(variant??"CIRCLE"))?.fixedColor??false;
export const badgeArtwork = {
 circle:"M50 3a47 47 0 1 1 0 94a47 47 0 1 1 0-94Z",
 crystal:"M44 6Q50 0 56 6L94 44Q100 50 94 56L56 94Q50 100 44 94L6 56Q0 50 6 44Z",
 seal:"M44 5Q50 0 56 5L67 16L83 17Q90 17 90 24L91 38L97 45Q102 50 97 56L89 65L89 80Q89 87 82 88L66 89L56 97Q50 102 44 97L34 89L18 88Q11 87 11 80L11 65L3 56Q-2 50 3 45L9 38L10 24Q10 17 17 17L33 16Z",
 luxury:"M50 3C62 3 65 15 76 15C91 15 86 31 95 41C103 51 90 61 89 72C88 88 73 84 62 93C50 103 40 91 29 90C13 90 17 74 7 63C-2 51 11 41 11 29C11 14 27 18 38 8Q45 2 50 3Z",
 hex:"M45 5Q50 2 55 5L90 25Q95 28 95 35V73Q95 78 90 81L55 98Q50 101 45 98L10 81Q5 78 5 73V35Q5 28 10 25Z",
 shield:"M50 3Q52 3 56 6L91 20Q96 22 96 28V49C96 73 79 90 50 98C21 90 4 73 4 49V28Q4 22 9 20L44 6Q48 3 50 3Z",
 ticket:"M12 21H88Q96 21 96 29V39C81 39 81 61 96 61V71Q96 79 88 79H12Q4 79 4 71V61C19 61 19 39 4 39V29Q4 21 12 21Z",
} as const;

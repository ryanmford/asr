const fs = require('fs');
let code = fs.readFileSync('src/components/list/ASRRankList.tsx', 'utf8');

const target = /         }\)}\n       <\/div>/;

const replacement = `         })}
         {visibleCount < finalAthletes.length && (
           <div ref={loaderRef} className="h-20 w-full flex items-center justify-center">
             <div className="animate-pulse w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary" />
           </div>
         )}
       </div>`;

if(target.test(code)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/list/ASRRankList.tsx', code);
    console.log("REPLACED");
} else {
    console.log("NOT FOUND");
}

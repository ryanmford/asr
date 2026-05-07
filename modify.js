import fs from "fs";

let content = fs.readFileSync("src/components/ASRListItems.tsx", "utf-8");

content = content.replace(
  'import { useAppStore } from "../store/useAppStore";',
  `import { useAppStore } from "../store/useAppStore";\nimport { motion } from "motion/react";`
);

content = content.replace(
  /if \(variant === "table"\) {\n return \(\n <div/g,
  `const ItemWrapper: any = layoutId ? motion.div : 'div';\n\n if (variant === "table") {\n return (\n <ItemWrapper layoutId={layoutId}`
);

content = content.replace(
  /return \(\n <div\n onClick={isUnclaimed \? undefined : onClick}/g,
  `return (\n <ItemWrapper layoutId={layoutId}\n onClick={isUnclaimed ? undefined : onClick}`
);

// We need to replace the closing </div> of each return exactly.
// It's safer to just replace them by their context.

let t1 = `    </div>
  );
  }`;
content = content.replace(
  t1,
  `    </ItemWrapper>\n  );\n  }`
);

let t2 = `      </div>
    </div>
  );
  },`;
content = content.replace(
  t2,
  `      </div>\n    </ItemWrapper>\n  );\n  },`
);

fs.writeFileSync("src/components/ASRListItems.tsx", content);

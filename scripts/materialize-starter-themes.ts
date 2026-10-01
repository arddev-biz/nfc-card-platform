/** One-time deployment step, NOT startup/GET seeding. Never overwrites saved themes.
 * Run: npx tsx scripts/materialize-starter-themes.ts
 * An intentional re-run restores deleted starter entries; do not schedule it.
 */
import {db} from "../lib/db";
import {materializeStarterThemes} from "../lib/services/custom-themes";
materializeStarterThemes().then(result=>console.log(`Materialized ${result.count} starter themes into the existing theme library.`)).catch(error=>{console.error(error instanceof Error?error.message:"Theme materialization failed.");process.exitCode=1}).finally(()=>db.$disconnect());

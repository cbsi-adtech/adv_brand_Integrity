import 'dotenv/config';
import { createFwClient } from '../fw.js';

async function main() {
  const [advertiserId, brandId] = process.argv.slice(2);
  if (!advertiserId || !brandId) {
    console.error('Usage: node server/scripts/discover-brand.js <advertiser_id> <brand_id>');
    process.exit(2);
  }

  const fw = createFwClient({
    url: process.env.FW_MCP_URL,
    username: process.env.FW_USERNAME,
    password: process.env.FW_PASSWORD,
    environment: process.env.FW_ENVIRONMENT || 'staging',
  });

  console.log(`Logging in to ${process.env.FW_ENVIRONMENT || 'staging'}...`);
  await fw.login();
  console.log('Login OK; fetching brand...');

  const result = await fw.invoke('sh_1_1_show-a-brand', {
    advertiser_id: Number(advertiserId),
    brand_id: Number(brandId),
  });

  console.log('---RAW BRAND BODY---');
  if (typeof result === 'string') {
    console.log(result);
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
  console.log('---END---');
  console.log('\nLook for the industry field. Expected one of:');
  console.log('  <industry_id>NNN</industry_id>            (scalar)');
  console.log('  <industries><industry id="NNN"/></industries>  (list)');
  console.log('If neither, update server/mutate-brand-xml.js findAndMutate to handle the new shape.');
}

main().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});

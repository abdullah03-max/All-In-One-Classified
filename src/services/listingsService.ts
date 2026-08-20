import { supabase } from '../lib/supabase';
import { Listing, SearchFilters, PaginatedResponse } from '../types';
import { cleanUuid } from '../utils/helpers';

const getDescendantIds = (allCats: { id: string; parent_id: string | null }[], parentId: string): string[] => {
  const ids = [parentId];
  const traverse = (pId: string) => {
    const children = allCats.filter(c => c.parent_id === pId);
    children.forEach(child => {
      ids.push(child.id);
      traverse(child.id);
    });
  };
  traverse(parentId);
  return ids;
};

export const listingsService = {
  async getListings(
    filters: SearchFilters = {},
    page = 1,
    perPage = 20
  ): Promise<PaginatedResponse<Listing>> {
    let query = supabase
      .from('listings')
      .select(`
        *,
        category:categories!listings_category_id_fkey(id, name, slug, icon, color),
        seller:users!listings_seller_id_fkey(id, full_name, avatar_url, is_verified, phone, city)
      `, { count: 'exact' })
      .eq('status', 'active');

    if (filters.query) {
      query = query.textSearch('search_vector', filters.query, { type: 'websearch' });
    }
    const targetCatId = filters.subcategory_id || filters.category_id;
    const isRentTarget = Boolean(
      targetCatId === 'c1000000-0000-0000-0000-000000000015' ||
      targetCatId === 'a8dfa959-a83b-438c-8ffb-3faaa43b1626' ||
      (targetCatId && (targetCatId.startsWith('d1000000-0000-0000-0000-0000000001') || targetCatId.startsWith('pr-') || targetCatId.startsWith('rent-')))
    );

    const isSaleTarget = Boolean(
      targetCatId === 'c1000000-0000-0000-0000-000000000002' ||
      targetCatId === 'property-for-sale'
    );

    if (isRentTarget) {
      query = query.or('category_id.eq.a8dfa959-a83b-438c-8ffb-3faaa43b1626,id.in.(24a25b38-e76d-4a3f-bc4a-10be14a363b6,8932b9d1-4729-42e8-aa4d-713d91657b91)');

      if (targetCatId && targetCatId !== 'c1000000-0000-0000-0000-000000000015' && targetCatId !== 'a8dfa959-a83b-438c-8ffb-3faaa43b1626') {
        const RENT_SUB_KEYWORDS: Record<string, string[]> = {
          'd1000000-0000-0000-0000-000000000101': ['house', 'home'],
          'd1000000-0000-0000-0000-000000000102': ['apart', 'appart', 'flat'],
          'd1000000-0000-0000-0000-000000000103': ['portion', 'floor'],
          'd1000000-0000-0000-0000-000000000104': ['shop', 'office', 'commercial'],
          'd1000000-0000-0000-0000-000000000105': ['room'],
          'd1000000-0000-0000-0000-000000000106': ['roommate', 'paying guest', 'pg'],
          'd1000000-0000-0000-0000-000000000107': ['vacation', 'guest house'],
          'd1000000-0000-0000-0000-000000000108': ['land', 'plot']
        };
        const keywords = RENT_SUB_KEYWORDS[targetCatId];
        if (keywords && keywords.length > 0) {
          const kwOr = keywords.map(kw => `title.ilike.%${kw}%,description.ilike.%${kw}%`).join(',');
          query = query.or(kwOr);
        }
      }
    } else if (isSaleTarget) {
      query = query.in('category_id', [
        'c1000000-0000-0000-0000-000000000002',
        '24e59436-fa5b-4fe6-898c-4ce34c4b901f',
        '9ef60e0a-9e89-4a78-86ef-5c9ea8b923dd',
        '4c4a2d5d-7303-4b97-8e1e-775337fe894e',
        '3f9d177a-5fc9-4a78-803e-111cbbd5831c'
      ]).not('id', 'in', '(24a25b38-e76d-4a3f-bc4a-10be14a363b6,8932b9d1-4729-42e8-aa4d-713d91657b91)');
    } else if (targetCatId === 'c1000000-0000-0000-0000-000000000016' || targetCatId === 'electronics-home-appliances' || (targetCatId && (targetCatId.startsWith('d1000000-0000-0000-0000-0000000002') || targetCatId.startsWith('d1000000-0000-0000-0000-00000000030') || targetCatId.startsWith('d1000000-0000-0000-0000-0000000004') || targetCatId.startsWith('d1000000-0000-0000-0000-0000000005') || targetCatId.startsWith('d1000000-0000-0000-0000-0000000006') || targetCatId.startsWith('d1000000-0000-0000-0000-0000000007') || targetCatId.startsWith('d1000000-0000-0000-0000-0000000008') || targetCatId.startsWith('d1000000-0000-0000-0000-0000000009') || targetCatId.startsWith('d1000000-0000-0000-0000-000000000a')))) {
      query = query.eq('category_id', 'c1000000-0000-0000-0000-000000000006');
      if (targetCatId && targetCatId !== 'c1000000-0000-0000-0000-000000000016' && targetCatId !== 'electronics-home-appliances') {
        const ELEC_SUB_KEYWORDS: Record<string, string[]> = {
          'd1000000-0000-0000-0000-000000000201': ['computer', 'laptop', 'pc', 'desktop', 'monitor', 'keyboard', 'mouse'],
          'd1000000-0000-0000-0000-000000000202': ['tv', 'television', 'led', 'lcd', 'smart tv', 'remote', 'mount', 'antenna', 'iptv'],
          'd1000000-0000-0000-0000-000000000203': ['video', 'audio', 'speaker', 'headphone', 'sound', 'amplifier'],
          'd1000000-0000-0000-0000-000000000204': ['refrigerator', 'fridge', 'freezer'],
          'd1000000-0000-0000-0000-000000000205': ['ac', 'air conditioner', 'cooler', 'inverter ac'],
          'd1000000-0000-0000-0000-000000000206': ['game', 'gaming', 'playstation', 'ps4', 'ps5', 'xbox', 'console'],
          'd1000000-0000-0000-0000-000000000207': ['washing machine', 'washer', 'dryer'],
          'd1000000-0000-0000-0000-000000000208': ['iron', 'steamer'],
          'd1000000-0000-0000-0000-000000000209': ['generator', 'ups', 'inverter', 'solar', 'battery'],
          'd1000000-0000-0000-0000-000000000210': ['microwave', 'oven', 'baking oven'],
          'd1000000-0000-0000-0000-000000000211': ['kitchen', 'blender', 'juicer', 'toaster', 'mixer'],
          'd1000000-0000-0000-0000-000000000212': ['fan', 'ceiling fan', 'pedestal fan'],
          'd1000000-0000-0000-0000-000000000213': ['heater', 'geyser', 'water heater'],
          'd1000000-0000-0000-0000-000000000214': ['air purifier', 'humidifier'],
          'd1000000-0000-0000-0000-000000000215': ['sewing', 'sewing machine'],
          'd1000000-0000-0000-0000-000000000216': ['water dispenser', 'dispenser'],
          'd1000000-0000-0000-0000-000000000217': ['tool', 'drill', 'diy', 'hardware'],
          'd1000000-0000-0000-0000-000000000218': ['appliance', 'electronic'],
          'd1000000-0000-0000-0000-000000000301': ['tv', 'television', 'led', 'lcd', 'smart tv'],
          'd1000000-0000-0000-0000-000000000302': ['android box', 'tv box', 'media player'],
          'd1000000-0000-0000-0000-000000000303': ['iptv', 'receiver'],
          'd1000000-0000-0000-0000-000000000304': ['dish', 'antenna', 'satellite'],
          'd1000000-0000-0000-0000-000000000305': ['projector', 'screen'],
          'd1000000-0000-0000-0000-000000000306': ['remote', 'tv remote'],
          'd1000000-0000-0000-0000-000000000307': ['hdmi', 'cable', 'av cable'],
          'd1000000-0000-0000-0000-000000000308': ['wall mount', 'mount', 'bracket', 'stand'],
          'd1000000-0000-0000-0000-000000000309': ['tv accessory', 'accessory'],
          'd1000000-0000-0000-0000-000000000401': ['speaker', 'woofer', 'subwoofer', 'bluetooth speaker'],
          'd1000000-0000-0000-0000-000000000402': ['amplifier', 'amp'],
          'd1000000-0000-0000-0000-000000000403': ['mic', 'microphone', 'wireless mic'],
          'd1000000-0000-0000-0000-000000000404': ['home theater', 'home cinema'],
          'd1000000-0000-0000-0000-000000000405': ['car audio', 'car video', 'car stereo', 'car speaker'],
          'd1000000-0000-0000-0000-000000000406': ['video', 'audio'],
          'd1000000-0000-0000-0000-000000000407': ['walkie talkie', 'intercom'],
          'd1000000-0000-0000-0000-000000000408': ['cd player', 'dvd player'],
          'd1000000-0000-0000-0000-000000000409': ['sound bar', 'soundbar'],
          'd1000000-0000-0000-0000-000000000410': ['radio', 'fm radio'],
          'd1000000-0000-0000-0000-000000000411': ['cassette', 'tape player', 'deck'],
          'd1000000-0000-0000-0000-000000000412': ['mixer', 'audio mixer'],
          'd1000000-0000-0000-0000-000000000413': ['mp3', 'mp3 player', 'ipod'],
          'd1000000-0000-0000-0000-000000000414': ['turntable', 'record player', 'vinyl'],
          'd1000000-0000-0000-0000-000000000415': ['audio interface', 'sound card'],
          'd1000000-0000-0000-0000-000000000416': ['digital recorder', 'voice recorder'],
          'd1000000-0000-0000-0000-000000000417': ['cable', 'wire', 'aux'],
          'd1000000-0000-0000-0000-000000000501': ['refrigerator', 'fridge'],
          'd1000000-0000-0000-0000-000000000502': ['freezer', 'deep freezer'],
          'd1000000-0000-0000-0000-000000000503': ['mini fridge', 'mini refrigerator', 'mini freezer'],
          'd1000000-0000-0000-0000-000000000504': ['fridge accessory', 'freezer accessory', 'refrigerator accessory'],
          'd1000000-0000-0000-0000-000000000601': ['air conditioner', 'ac', 'inverter ac', 'split ac'],
          'd1000000-0000-0000-0000-000000000602': ['air cooler', 'cooler', 'room cooler'],
          'd1000000-0000-0000-0000-000000000603': ['ac accessory', 'cooler accessory', 'ac remote'],
          'd1000000-0000-0000-0000-000000000701': ['playstation', 'ps4', 'ps5', 'xbox', 'nintendo', 'console'],
          'd1000000-0000-0000-0000-000000000702': ['video game', 'game disc', 'ps4 game', 'ps5 game', 'xbox game'],
          'd1000000-0000-0000-0000-000000000703': ['controller', 'joystick', 'gamepad', 'dual shock', 'dualsense'],
          'd1000000-0000-0000-0000-000000000704': ['gaming accessory', 'gaming headset', 'steering wheel', 'gaming chair'],
          'd1000000-0000-0000-0000-000000000801': ['washer', 'washing machine'],
          'd1000000-0000-0000-0000-000000000802': ['spin dryer', 'dryer', 'spinner'],
          'd1000000-0000-0000-0000-000000000803': ['washer & dryer', 'washer dryer', 'automatic washing machine'],
          'd1000000-0000-0000-0000-000000000804': ['washing machine accessory', 'dryer accessory', 'cover'],
          'd1000000-0000-0000-0000-000000000805': ['iron', 'dry iron', 'steam iron'],
          'd1000000-0000-0000-0000-000000000806': ['steamer', 'garment steamer'],
          'd1000000-0000-0000-0000-000000000807': ['generator', 'genset'],
          'd1000000-0000-0000-0000-000000000808': ['ups', 'inverter'],
          'd1000000-0000-0000-0000-000000000809': ['solar panel', 'solar plate'],
          'd1000000-0000-0000-0000-000000000810': ['solar inverter', 'hybrid inverter'],
          'd1000000-0000-0000-0000-000000000811': ['solar accessory', 'solar cable', 'solar structure'],
          'd1000000-0000-0000-0000-000000000812': ['battery', 'tubular battery', 'dry battery'],
          'd1000000-0000-0000-0000-000000000813': ['oven', 'baking oven', 'electric oven'],
          'd1000000-0000-0000-0000-000000000814': ['microwave', 'microwave oven'],
          'd1000000-0000-0000-0000-000000000901': ['juicer', 'citrus juicer'],
          'd1000000-0000-0000-0000-000000000902': ['food factory', 'food processor'],
          'd1000000-0000-0000-0000-000000000903': ['stove', 'gas stove'],
          'd1000000-0000-0000-0000-000000000904': ['blender', 'hand blender'],
          'd1000000-0000-0000-0000-000000000905': ['air fryer', 'fryer'],
          'd1000000-0000-0000-0000-000000000906': ['chopper', 'mini chopper'],
          'd1000000-0000-0000-0000-000000000907': ['grill', 'barbecue grill'],
          'd1000000-0000-0000-0000-000000000908': ['water purifier', 'water filter', 'ro filter'],
          'd1000000-0000-0000-0000-000000000909': ['mixer', 'hand mixer', 'stand mixer'],
          'd1000000-0000-0000-0000-000000000910': ['kettle', 'electric kettle'],
          'd1000000-0000-0000-0000-000000000911': ['toaster', 'pop up toaster'],
          'd1000000-0000-0000-0000-000000000912': ['cooker', 'rice cooker', 'pressure cooker'],
          'd1000000-0000-0000-0000-000000000913': ['hot plate', 'induction cooker'],
          'd1000000-0000-0000-0000-000000000914': ['coffee machine', 'espresso maker', 'tea maker'],
          'd1000000-0000-0000-0000-000000000915': ['hob', 'gas hob'],
          'd1000000-0000-0000-0000-000000000916': ['sandwich maker', 'waffle maker'],
          'd1000000-0000-0000-0000-000000000917': ['slicer', 'vegetable slicer'],
          'd1000000-0000-0000-0000-000000000918': ['hood', 'range hood', 'kitchen hood'],
          'd1000000-0000-0000-0000-000000000919': ['meat grinder', 'mincer'],
          'd1000000-0000-0000-0000-000000000920': ['dishwasher'],
          'd1000000-0000-0000-0000-000000000921': ['roti maker'],
          'd1000000-0000-0000-0000-000000000922': ['sink', 'kitchen sink'],
          'd1000000-0000-0000-0000-000000000923': ['steamer', 'food steamer'],
          'd1000000-0000-0000-0000-000000000924': ['kitchen appliance', 'kitchen item'],
          'd1000000-0000-0000-0000-000000000925': ['kitchen accessory', 'appliance accessory'],
          'd1000000-0000-0000-0000-000000000a01': ['ceiling fan'],
          'd1000000-0000-0000-0000-000000000a02': ['pedestal fan', 'standing fan'],
          'd1000000-0000-0000-0000-000000000a03': ['bracket fan', 'wall fan'],
          'd1000000-0000-0000-0000-000000000a04': ['exhaust fan', 'exhaust'],
          'd1000000-0000-0000-0000-000000000a05': ['mist fan', 'misting fan'],
          'd1000000-0000-0000-0000-000000000a06': ['portable fan', 'rechargeable fan', 'mini fan'],
          'd1000000-0000-0000-0000-000000000a07': ['geyser', 'gas geyser', 'electric geyser'],
          'd1000000-0000-0000-0000-000000000a08': ['heating rod', 'water heater rod'],
          'd1000000-0000-0000-0000-000000000a09': ['heater', 'room heater', 'gas heater'],
          'd1000000-0000-0000-0000-000000000a10': ['hand tool', 'wrench', 'screwdriver', 'pliers', 'hammer'],
          'd1000000-0000-0000-0000-000000000a11': ['power tool', 'drill', 'grinder', 'saw'],
          'd1000000-0000-0000-0000-000000000a12': ['electrical', 'wire', 'switch', 'socket', 'breaker'],
          'd1000000-0000-0000-0000-000000000a13': ['equipment', 'tool', 'hardware']
        };
        const keywords = ELEC_SUB_KEYWORDS[targetCatId] || [];
        const matchParts: string[] = [
          `subcategory_id.eq.${targetCatId}`,
          `sub_subcategory_id.eq.${targetCatId}`,
          `attributes->>virtual_subcategory_id.eq."${targetCatId}"`,
          `attributes->>virtual_sub_subcategory_id.eq."${targetCatId}"`,
          `attributes->>subcategory_id.eq."${targetCatId}"`,
          `attributes->>sub_subcategory_id.eq."${targetCatId}"`
        ];
        if (keywords.length > 0) {
          keywords.forEach(kw => {
            matchParts.push(`title.ilike.%${kw}%`);
            matchParts.push(`description.ilike.%${kw}%`);
            matchParts.push(`attributes->>subcategory_name.ilike.%${kw}%`);
            matchParts.push(`attributes->>sub_subcategory_name.ilike.%${kw}%`);
          });
        }
        query = query.or(matchParts.join(','));
      } else {
        query = query.or('attributes->>virtual_category_id.eq.c1000000-0000-0000-0000-000000000016,attributes->>virtual_subcategory_id.ilike.d1000000-0000-0000-0000-0000000002%,attributes->>virtual_subcategory_id.ilike.d1000000-0000-0000-0000-00000000030%,attributes->>virtual_subcategory_id.ilike.d1000000-0000-0000-0000-0000000004%,attributes->>virtual_subcategory_id.ilike.d1000000-0000-0000-0000-0000000005%,attributes->>virtual_subcategory_id.ilike.d1000000-0000-0000-0000-0000000006%,attributes->>virtual_subcategory_id.ilike.d1000000-0000-0000-0000-0000000007%,attributes->>virtual_subcategory_id.ilike.d1000000-0000-0000-0000-0000000008%,attributes->>virtual_subcategory_id.ilike.d1000000-0000-0000-0000-0000000009%,attributes->>virtual_subcategory_id.ilike.d1000000-0000-0000-0000-000000000a%');
      }
    } else if (targetCatId === 'c1000000-0000-0000-0000-000000000004' || targetCatId === 'jobs' || (targetCatId && targetCatId.startsWith('d1000000-0000-0000-0000-000000004'))) {
      query = query.eq('category_id', 'c1000000-0000-0000-0000-000000000004');
      if (targetCatId && targetCatId !== 'c1000000-0000-0000-0000-000000000004' && targetCatId !== 'jobs') {
        const matchParts: string[] = [
          `attributes->>virtual_subcategory_id.eq."${targetCatId}"`
        ];
        query = query.or(matchParts.join(','));
      } else {
        query = query.or('attributes->>virtual_category_id.is.null,attributes->>virtual_category_id.eq.c1000000-0000-0000-0000-000000000004');
      }
    } else if (targetCatId === 'c1000000-0000-0000-0000-000000000006' || targetCatId === 'furniture-home-decor' || (targetCatId && (targetCatId.startsWith('d1000000-0000-0000-0000-00000000031') || targetCatId.startsWith('d1000000-0000-0000-0000-00000000032') || targetCatId.startsWith('d1000000-0000-0000-0000-000000001') || targetCatId.startsWith('d1000000-0000-0000-0000-000000002')))) {
      query = query.eq('category_id', 'c1000000-0000-0000-0000-000000000006');
      if (targetCatId && targetCatId !== 'c1000000-0000-0000-0000-000000000006' && targetCatId !== 'furniture-home-decor') {
        const matchParts: string[] = [
          `attributes->>virtual_subcategory_id.eq."${targetCatId}"`,
          `attributes->>virtual_sub_subcategory_id.eq."${targetCatId}"`
        ];
        query = query.or(matchParts.join(','));
      } else {
        query = query.or('attributes->>virtual_category_id.is.null,attributes->>virtual_category_id.eq.c1000000-0000-0000-0000-000000000006');
      }
    } else if (targetCatId === 'c1000000-0000-0000-0000-000000000009' || targetCatId === 'animals' || targetCatId === 'pets' || (targetCatId && (targetCatId.startsWith('d1000000-0000-0000-0000-000000000b') || targetCatId.startsWith('d1000000-0000-0000-0000-000000000c')))) {
      query = query.eq('category_id', 'c1000000-0000-0000-0000-000000000009');
      if (targetCatId && targetCatId !== 'c1000000-0000-0000-0000-000000000009' && targetCatId !== 'animals' && targetCatId !== 'pets') {
        const ANIMAL_SUB_KEYWORDS: Record<string, string[]> = {
          'd1000000-0000-0000-0000-000000000b01': ['hen', 'aseel', 'chicken', 'rooster', 'desikukad', 'jora', 'misri', 'bantam', 'frizzle', 'silkie', 'laced'],
          'd1000000-0000-0000-0000-000000000b02': ['parrot', 'macaw', 'raw', 'ringneck', 'cockatiel', 'lovebird', 'budgie', 'conure'],
          'd1000000-0000-0000-0000-000000000b03': ['livestock', 'cattle', 'cow', 'bull', 'buffalo', 'goat', 'sheep', 'camel'],
          'c1000000-0000-0000-0000-000000000148': ['cat', 'persian', 'kitten'],
          'c1000000-0000-0000-0000-000000000151': ['food', 'accessory', 'cage', 'belt'],
          'c1000000-0000-0000-0000-000000000147': ['dog', 'puppy', 'german shepherd', 'labrador', 'pug'],
          'd1000000-0000-0000-0000-000000000b07': ['pigeon', 'kabootar', 'kabutar', 'teddy', 'kasuri'],
          'd1000000-0000-0000-0000-000000000b08': ['rabbit', 'khargosh'],
          'd1000000-0000-0000-0000-000000000b09': ['finch', 'finches'],
          'c1000000-0000-0000-0000-000000000150': ['fish', 'aquarium'],
          'd1000000-0000-0000-0000-000000000b11': ['bird', 'birds'],
          'd1000000-0000-0000-0000-000000000b12': ['egg', 'eggs', 'fertile'],
          'd1000000-0000-0000-0000-000000000b13': ['duck', 'ducks'],
          'd1000000-0000-0000-0000-000000000b14': ['animal', 'pet'],
          'd1000000-0000-0000-0000-000000000b15': ['dove', 'doves'],
          'd1000000-0000-0000-0000-000000000b16': ['peacock', 'peacocks'],
          'd1000000-0000-0000-0000-000000000b17': ['horse', 'horses'],
          'd1000000-0000-0000-0000-000000000c01': ['buffalo', 'buffalos', 'bhains'],
          'd1000000-0000-0000-0000-000000000c02': ['bull', 'bulls', 'wanda'],
          'd1000000-0000-0000-0000-000000000c03': ['camel', 'camels', 'oont'],
          'd1000000-0000-0000-0000-000000000c04': ['cow', 'cows', 'gaay'],
          'd1000000-0000-0000-0000-000000000c05': ['goat', 'goats', 'bakra', 'bakri'],
          'd1000000-0000-0000-0000-000000000c06': ['sheep', 'chhatra', 'dumba'],
          'd1000000-0000-0000-0000-000000000c07': ['livestock', 'animal']
        };
        const keywords = ANIMAL_SUB_KEYWORDS[targetCatId] || [];
        const matchParts: string[] = [
          `subcategory_id.eq.${targetCatId}`,
          `sub_subcategory_id.eq.${targetCatId}`,
          `attributes->>virtual_subcategory_id.eq."${targetCatId}"`,
          `attributes->>virtual_sub_subcategory_id.eq."${targetCatId}"`,
          `attributes->>subcategory_id.eq."${targetCatId}"`,
          `attributes->>sub_subcategory_id.eq."${targetCatId}"`
        ];
        if (keywords.length > 0) {
          keywords.forEach(kw => {
            matchParts.push(`title.ilike.%${kw}%`);
            matchParts.push(`description.ilike.%${kw}%`);
            matchParts.push(`attributes->>subcategory_name.ilike.%${kw}%`);
            matchParts.push(`attributes->>sub_subcategory_name.ilike.%${kw}%`);
          });
        }
        query = query.or(matchParts.join(','));
      }
    } else if (targetCatId === 'c1000000-0000-0000-0000-000000000007' || targetCatId === 'services' || (targetCatId && (targetCatId.startsWith('d1000000-0000-0000-0000-000000000d') || targetCatId.startsWith('d1000000-0000-0000-0000-000000000e')))) {
      query = query.eq('category_id', 'c1000000-0000-0000-0000-000000000007');
      if (targetCatId && targetCatId !== 'c1000000-0000-0000-0000-000000000007' && targetCatId !== 'services') {
        const SERVICE_SUB_KEYWORDS: Record<string, string[]> = {
          'd1000000-0000-0000-0000-000000000d01': ['architecture', 'interior', 'architect', 'decor', 'design', 'cad'],
          'd1000000-0000-0000-0000-000000000d02': ['camera', 'cctv', 'security camera', 'installation'],
          'd1000000-0000-0000-0000-000000000d03': ['car rental', 'rent a car', 'car rent'],
          'd1000000-0000-0000-0000-000000000d04': ['car service', 'auto repair', 'mechanic', 'tuning', 'denting', 'painting'],
          'd1000000-0000-0000-0000-000000000d05': ['catering', 'caterer', 'restaurant', 'food service', 'deeg'],
          'd1000000-0000-0000-0000-000000000d06': ['construction', 'builder', 'contractor', 'renovation', 'mason'],
          'd1000000-0000-0000-0000-000000000d07': ['consultancy', 'consultant', 'advisory', 'tax', 'legal'],
          'd1000000-0000-0000-0000-000000000d08': ['domestic help', 'maid', 'servant', 'cook', 'nanny', 'cleaner'],
          'd1000000-0000-0000-0000-000000000d09': ['driver', 'taxi', 'cab', 'chauffeur'],
          'd1000000-0000-0000-0000-000000000d10': ['tuition', 'tutor', 'academy', 'coaching', 'teacher'],
          'd1000000-0000-0000-0000-000000000d11': ['repair', 'electronics repair', 'computer repair', 'laptop repair', 'technician'],
          'd1000000-0000-0000-0000-000000000d13': ['farm', 'fresh food', 'dairy', 'milk', 'vegetable', 'fruit'],
          'd1000000-0000-0000-0000-000000000d14': ['health', 'beauty', 'parlor', 'salon', 'makeup', 'massage', 'fitness'],
          'd1000000-0000-0000-0000-000000000d15': ['repair', 'plumber', 'electrician', 'handyman', 'carpenter'],
          'd1000000-0000-0000-0000-000000000d16': ['insurance', 'takaful', 'life insurance', 'car insurance'],
          'd1000000-0000-0000-0000-000000000d17': ['marriage', 'rishta', 'matrimonial', 'bureau', 'matchmaking'],
          'd1000000-0000-0000-0000-000000000d18': ['movers', 'packers', 'shifting', 'goods transport', 'cargo'],
          'd1000000-0000-0000-0000-000000000d19': ['renting', 'rent service', 'equipment rental'],
          'd1000000-0000-0000-0000-000000000d20': ['tailor', 'stitching', 'boutique', 'alteration'],
          'd1000000-0000-0000-0000-000000000d21': ['travel', 'visa', 'ticket', 'umrah', 'hajj', 'tour'],
          'd1000000-0000-0000-0000-000000000d24': ['service', 'services'],
          'd1000000-0000-0000-0000-000000000e01': ['maid', 'maids', 'housemaid'],
          'd1000000-0000-0000-0000-000000000e02': ['babysitter', 'nanny', 'childcare'],
          'd1000000-0000-0000-0000-000000000e03': ['cook', 'chef', 'khansama'],
          'd1000000-0000-0000-0000-000000000e04': ['nursing', 'nurse', 'patient care'],
          'd1000000-0000-0000-0000-000000000e05': ['domestic help', 'domestic servant'],
          'd1000000-0000-0000-0000-000000000e06': ['driver', 'chauffeur'],
          'd1000000-0000-0000-0000-000000000e07': ['pick and drop', 'pick & drop', 'school pick'],
          'd1000000-0000-0000-0000-000000000e08': ['carpool', 'car pool', 'ride share'],
          'd1000000-0000-0000-0000-000000000e10': ['painter', 'painters', 'painting', 'wall paint'],
          'd1000000-0000-0000-0000-000000000e11': ['electrician', 'electricians', 'electrical', 'wiring'],
          'd1000000-0000-0000-0000-000000000e12': ['plumber', 'plumbers', 'plumbing', 'pipe', 'sanitary'],
          'd1000000-0000-0000-0000-000000000e13': ['carpenter', 'carpenters', 'woodwork', 'furniture repair'],
          'd1000000-0000-0000-0000-000000000e14': ['pest control', 'termite', 'fumigation', 'cockroach'],
          'd1000000-0000-0000-0000-000000000e15': ['water tank', 'tank cleaning', 'water tank cleaning'],
          'd1000000-0000-0000-0000-000000000e16': ['deep cleaning', 'home cleaning', 'sofa cleaning', 'carpet cleaning'],
          'd1000000-0000-0000-0000-000000000e17': ['geyser', 'geyser repair', 'water heater', 'geyser service'],
          'd1000000-0000-0000-0000-000000000e18': ['ac service', 'ac repair', 'air conditioner', 'ac gas'],
          'd1000000-0000-0000-0000-000000000e19': ['repair', 'handyman', 'maintenance', 'fixing'],
          'd1000000-0000-0000-0000-000000000e20': ['beauty', 'spa', 'parlor', 'salon', 'makeup', 'massage', 'facial', 'skin'],
          'd1000000-0000-0000-0000-000000000e21': ['fitness', 'trainer', 'gym', 'workout', 'personal trainer', 'coaching'],
          'd1000000-0000-0000-0000-000000000e22': ['health', 'medical', 'clinic', 'doctor', 'therapy', 'healthcare']
        };
        const keywords = SERVICE_SUB_KEYWORDS[targetCatId] || [];
        const matchParts: string[] = [
          `subcategory_id.eq.${targetCatId}`,
          `sub_subcategory_id.eq.${targetCatId}`,
          `attributes->>virtual_subcategory_id.eq."${targetCatId}"`,
          `attributes->>virtual_sub_subcategory_id.eq."${targetCatId}"`,
          `attributes->>subcategory_id.eq."${targetCatId}"`,
          `attributes->>sub_subcategory_id.eq."${targetCatId}"`
        ];
        if (keywords.length > 0) {
          keywords.forEach(kw => {
            matchParts.push(`title.ilike.%${kw}%`);
            matchParts.push(`description.ilike.%${kw}%`);
            matchParts.push(`attributes->>subcategory_name.ilike.%${kw}%`);
            matchParts.push(`attributes->>sub_subcategory_name.ilike.%${kw}%`);
          });
        }
        query = query.or(matchParts.join(','));
      }
    } else if (targetCatId === 'c1000000-0000-0000-0000-000000000011' || targetCatId === 'business-industrial' || (targetCatId && targetCatId.startsWith('d1000000-0000-0000-0000-000000000f'))) {
      query = query.eq('category_id', 'c1000000-0000-0000-0000-000000000011');
      if (targetCatId && targetCatId !== 'c1000000-0000-0000-0000-000000000011' && targetCatId !== 'business-industrial') {
        const BIZ_SUB_KEYWORDS: Record<string, string[]> = {
          'd1000000-0000-0000-0000-000000000f01': ['business', 'sale', 'franchise', 'company', 'shop for sale', 'running business'],
          'd1000000-0000-0000-0000-000000000f02': ['food', 'restaurant', 'cafe', 'kitchen', 'hotel', 'catering'],
          'd1000000-0000-0000-0000-000000000f03': ['construction', 'heavy machinery', 'crane', 'excavator', 'loader', 'bulldozer', 'scaffolding'],
          'd1000000-0000-0000-0000-000000000f04': ['agriculture', 'farming', 'crops', 'seeds', 'fertilizer', 'tractor', 'farm'],
          'd1000000-0000-0000-0000-000000000f05': ['medical', 'pharma', 'hospital', 'clinic', 'surgical', 'medicine', 'pharmaceutical'],
          'd1000000-0000-0000-0000-000000000f06': ['trade', 'industrial machinery', 'machine', 'lathe', 'generator', 'factory', 'plant'],
          'd1000000-0000-0000-0000-000000000f07': ['business', 'industry', 'industrial', 'commercial'],
          'd1000000-0000-0000-0000-000000000f10': ['mobile shop', 'phone shop', 'mobile store'],
          'd1000000-0000-0000-0000-000000000f11': ['water plant', 'water filtration', 'ro plant', 'mineral water'],
          'd1000000-0000-0000-0000-000000000f12': ['beauty salon', 'salon', 'parlor', 'barber'],
          'd1000000-0000-0000-0000-000000000f13': ['grocery store', 'supermarket', 'mart', 'general store'],
          'd1000000-0000-0000-0000-000000000f14': ['hotel', 'restaurant', 'cafe', 'fast food', 'dhaba'],
          'd1000000-0000-0000-0000-000000000f15': ['pharmacy', 'medical store', 'chemist'],
          'd1000000-0000-0000-0000-000000000f16': ['snooker', 'billiards', 'snooker club'],
          'd1000000-0000-0000-0000-000000000f17': ['cosmetic', 'jewellery', 'jewelry shop'],
          'd1000000-0000-0000-0000-000000000f18': ['gym', 'fitness center', 'fitness club'],
          'd1000000-0000-0000-0000-000000000f19': ['clinic', 'medical clinic', 'lab'],
          'd1000000-0000-0000-0000-000000000f20': ['franchise', 'dealership'],
          'd1000000-0000-0000-0000-000000000f21': ['gift shop', 'toy shop', 'gift store'],
          'd1000000-0000-0000-0000-000000000f22': ['petrol pump', 'filling station', 'gas station'],
          'd1000000-0000-0000-0000-000000000f23': ['auto parts shop', 'spare parts shop', 'auto shop'],
          'd1000000-0000-0000-0000-000000000f24': ['business', 'running shop', 'store for sale'],
          'd1000000-0000-0000-0000-000000000f30': ['baking', 'baking equipment', 'deck oven', 'dough mixer'],
          'd1000000-0000-0000-0000-000000000f31': ['food display', 'display counter', 'bakery counter'],
          'd1000000-0000-0000-0000-000000000f32': ['oven', 'tandoor', 'pizza oven', 'baking oven'],
          'd1000000-0000-0000-0000-000000000f33': ['fryer', 'deep fryer', 'commercial fryer'],
          'd1000000-0000-0000-0000-000000000f34': ['table', 'platform', 'work table', 'stainless steel table'],
          'd1000000-0000-0000-0000-000000000f35': ['fruit machine', 'vegetable cutter', 'slicer', 'juicer'],
          'd1000000-0000-0000-0000-000000000f36': ['chiller', 'commercial fridge', 'refrigerated counter'],
          'd1000000-0000-0000-0000-000000000f37': ['food stall', 'food cart', 'kiosk'],
          'd1000000-0000-0000-0000-000000000f38': ['delivery bag', 'food delivery bag', 'thermal bag'],
          'd1000000-0000-0000-0000-000000000f39': ['crockery', 'cutlery', 'plates', 'dishes', 'utensils'],
          'd1000000-0000-0000-0000-000000000f40': ['ice cream machine', 'soft serve machine', 'ice cream'],
          'd1000000-0000-0000-0000-000000000f41': ['restaurant equipment', 'kitchen equipment', 'food equipment'],
          'd1000000-0000-0000-0000-000000000f50': ['construction material', 'cement', 'steel', 'bricks', 'tiles'],
          'd1000000-0000-0000-0000-000000000f51': ['concrete grinder', 'surface grinder', 'floor grinder'],
          'd1000000-0000-0000-0000-000000000f52': ['drill machine', 'core drill', 'hammer drill'],
          'd1000000-0000-0000-0000-000000000f53': ['loader', 'wheel loader', 'bobcat'],
          'd1000000-0000-0000-0000-000000000f54': ['concrete mixer', 'cement mixer', 'mixer machine'],
          'd1000000-0000-0000-0000-000000000f55': ['road roller', 'roller', 'compactor roller'],
          'd1000000-0000-0000-0000-000000000f56': ['crane', 'tower crane', 'mobile crane'],
          'd1000000-0000-0000-0000-000000000f57': ['lifter', 'construction lifter', 'hoist'],
          'd1000000-0000-0000-0000-000000000f58': ['paver', 'asphalt paver'],
          'd1000000-0000-0000-0000-000000000f59': ['excavator', 'digger', 'jcb'],
          'd1000000-0000-0000-0000-000000000f60': ['concrete cutter', 'floor cutter'],
          'd1000000-0000-0000-0000-000000000f61': ['compactor', 'plate compactor', 'rammer'],
          'd1000000-0000-0000-0000-000000000f62': ['water pump', 'dewatering pump'],
          'd1000000-0000-0000-0000-000000000f63': ['bulldozer', 'dozer'],
          'd1000000-0000-0000-0000-000000000f64': ['air compressor', 'compressor'],
          'd1000000-0000-0000-0000-000000000f65': ['dump truck', 'dumper'],
          'd1000000-0000-0000-0000-000000000f66': ['motor grader', 'grader'],
          'd1000000-0000-0000-0000-000000000f67': ['heavy equipment', 'construction equipment'],
          'd1000000-0000-0000-0000-000000000f70': ['farm machinery', 'farm equipment', 'harvester', 'thresher'],
          'd1000000-0000-0000-0000-000000000f71': ['seed', 'seeds', 'hybrid seeds'],
          'd1000000-0000-0000-0000-000000000f72': ['crop', 'crops', 'wheat', 'rice', 'cotton'],
          'd1000000-0000-0000-0000-000000000f73': ['pesticide', 'fertilizer', 'spray', 'chemical'],
          'd1000000-0000-0000-0000-000000000f74': ['plant', 'tree', 'nursery', 'sapling'],
          'd1000000-0000-0000-0000-000000000f75': ['agriculture', 'farming'],
          'd1000000-0000-0000-0000-000000000f76': ['silage', 'corn silage', 'fodder'],
          'd1000000-0000-0000-0000-000000000f80': ['ultrasound', 'ultrasound machine', 'ultrasound scanner'],
          'd1000000-0000-0000-0000-000000000f81': ['surgical mask', 'face mask', 'mask'],
          'd1000000-0000-0000-0000-000000000f82': ['patient bed', 'hospital bed', 'icubed'],
          'd1000000-0000-0000-0000-000000000f83': ['wheelchair', 'electric wheelchair'],
          'd1000000-0000-0000-0000-000000000f84': ['oxygen concentrator', 'concentrator'],
          'd1000000-0000-0000-0000-000000000f85': ['oxygen cylinder', 'o2 cylinder'],
          'd1000000-0000-0000-0000-000000000f86': ['pulse oximeter', 'oximeter'],
          'd1000000-0000-0000-0000-000000000f87': ['hearing aid', 'ear aid'],
          'd1000000-0000-0000-0000-000000000f88': ['bp monitor', 'blood pressure'],
          'd1000000-0000-0000-0000-000000000f89': ['thermometer', 'digital thermometer'],
          'd1000000-0000-0000-0000-000000000f90': ['walker', 'walking frame'],
          'd1000000-0000-0000-0000-000000000f91': ['nebulizer', 'nebuliser machine'],
          'd1000000-0000-0000-0000-000000000f92': ['sanitizer', 'hand sanitizer'],
          'd1000000-0000-0000-0000-000000000f93': ['surgical glove', 'latex gloves'],
          'd1000000-0000-0000-0000-000000000f94': ['xray', 'x-ray machine'],
          'd1000000-0000-0000-0000-000000000f95': ['medical light', 'operation light', 'ot light'],
          'd1000000-0000-0000-0000-000000000f96': ['medicine', 'pharmaceuticals'],
          'd1000000-0000-0000-0000-000000000f97': ['glucometer', 'sugar monitor'],
          'd1000000-0000-0000-0000-000000000f98': ['breast pump', 'electric breast pump'],
          'd1000000-0000-0000-0000-000000000f99': ['commode chair', 'toilet chair'],
          'd1000000-0000-0000-0000-000000000fa0': ['surgical instrument', 'forceps', 'scissors'],
          'd1000000-0000-0000-0000-000000000fa1': ['scrubs', 'medical scrub', 'doctor coat'],
          'd1000000-0000-0000-0000-000000000fa2': ['weighing scale', 'weight machine'],
          'd1000000-0000-0000-0000-000000000fa3': ['health accessory', 'medical accessory'],
          'd1000000-0000-0000-0000-000000000fa4': ['microscope', 'lab microscope'],
          'd1000000-0000-0000-0000-000000000fa5': ['medical supply', 'hospital supply'],
          'd1000000-0000-0000-0000-000000000fb0': ['woodworking machine', 'saw machine', 'planner'],
          'd1000000-0000-0000-0000-000000000fb1': ['currency counter', 'cash counting machine', 'note counting'],
          'd1000000-0000-0000-0000-000000000fb2': ['plastic machine', 'rubber machine', 'extruder'],
          'd1000000-0000-0000-0000-000000000fb3': ['laser machine', 'laser cutter', 'laser marking'],
          'd1000000-0000-0000-0000-000000000fb4': ['molding machine', 'injection molding'],
          'd1000000-0000-0000-0000-000000000fb5': ['packaging machine', 'packing machine'],
          'd1000000-0000-0000-0000-000000000fb6': ['welding plant', 'welding machine', 'mig welder'],
          'd1000000-0000-0000-0000-000000000fb7': ['paper machine', 'paper cup machine'],
          'd1000000-0000-0000-0000-000000000fb8': ['air compressor', 'industrial compressor'],
          'd1000000-0000-0000-0000-000000000fb9': ['sealing machine', 'band sealer'],
          'd1000000-0000-0000-0000-000000000fc0': ['lathe machine', 'khraadi', 'cnc lathe'],
          'd1000000-0000-0000-0000-000000000fc1': ['filling machine', 'liquid filling'],
          'd1000000-0000-0000-0000-000000000fc2': ['marking machine', 'batch coding'],
          'd1000000-0000-0000-0000-000000000fc3': ['textile machine', 'loom', 'spinning'],
          'd1000000-0000-0000-0000-000000000fc4': ['sewing machine', 'juki machine', 'silai machine'],
          'd1000000-0000-0000-0000-000000000fc5': ['knitting machine', 'flat knitting'],
          'd1000000-0000-0000-0000-000000000fc6': ['embroidery machine', 'kadai machine'],
          'd1000000-0000-0000-0000-000000000fc7': ['printing machine', 'offset printing', 'flexo'],
          'd1000000-0000-0000-0000-000000000fc8': ['industrial machine', 'factory machine', 'plant']
        };
        const keywords = BIZ_SUB_KEYWORDS[targetCatId] || [];
        const matchParts: string[] = [
          `subcategory_id.eq.${targetCatId}`,
          `sub_subcategory_id.eq.${targetCatId}`,
          `attributes->>virtual_subcategory_id.eq."${targetCatId}"`,
          `attributes->>virtual_sub_subcategory_id.eq."${targetCatId}"`,
          `attributes->>subcategory_id.eq."${targetCatId}"`,
          `attributes->>sub_subcategory_id.eq."${targetCatId}"`
        ];
        if (keywords.length > 0) {
          keywords.forEach(kw => {
            matchParts.push(`title.ilike.%${kw}%`);
            matchParts.push(`description.ilike.%${kw}%`);
            matchParts.push(`attributes->>subcategory_name.ilike.%${kw}%`);
            matchParts.push(`attributes->>sub_subcategory_name.ilike.%${kw}%`);
          });
        }
        query = query.or(matchParts.join(','));
      }
    } else if (targetCatId) {
      const { data: allCats } = await supabase.from('categories').select('id, parent_id');
      if (allCats) {
        const descendantIds = getDescendantIds(allCats, targetCatId);
        const csv = descendantIds.join(',');
        query = query.or(`category_id.in.(${csv}),subcategory_id.in.(${csv}),sub_subcategory_id.in.(${csv})`);
      } else {
        query = query.or(`category_id.eq.${targetCatId},subcategory_id.eq.${targetCatId},sub_subcategory_id.eq.${targetCatId}`);
      }
    }

    if (filters.min_price !== undefined) query = query.gte('price', filters.min_price);
    if (filters.max_price !== undefined) query = query.lte('price', filters.max_price);
    if (filters.condition) {
      query = query.or(`condition.eq.${filters.condition},attributes->>condition.eq.${filters.condition},attributes->>condition.ilike.%${filters.condition}%`);
    }
    if (filters.location) {
      query = query.or(`city.ilike.%${filters.location}%,location.ilike.%${filters.location}%`);
    }
    if (filters.is_featured) query = query.eq('is_featured', true);
    if (filters.furnished) {
      query = query.or(`attributes->>furnished.ilike.%${filters.furnished}%,attributes->>furnished.eq.${filters.furnished}`);
    }
    if (filters.sex) {
      query = query.or(`attributes->>sex.ilike.%${filters.sex}%,attributes->>sex.eq.${filters.sex},attributes->>animal_sex.ilike.%${filters.sex}%,title.ilike.%${filters.sex}%,description.ilike.%${filters.sex}%`);
    }
    if (filters.gender) {
      query = query.or(`attributes->>gender.ilike.%${filters.gender}%,attributes->>gender.eq.${filters.gender},attributes->>human_gender.ilike.%${filters.gender}%,title.ilike.%${filters.gender}%,description.ilike.%${filters.gender}%`);
    }

    switch (filters.sort_by) {
      case 'price_asc': query = query.order('price', { ascending: true }); break;
      case 'price_desc': query = query.order('price', { ascending: false }); break;
      case 'views': query = query.order('views_count', { ascending: false }); break;
      default: query = query.order('created_at', { ascending: false });
    }

    const from = (page - 1) * perPage;
    query = query.range(from, from + perPage - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      data: data as unknown as Listing[],
      count: count || 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count || 0) / perPage),
    };
  },

  async recordUniqueView(id: string, viewerId?: string, sellerId?: string): Promise<boolean> {
    try {
      // Do not count seller viewing their own listing
      if (viewerId && sellerId && viewerId === sellerId) {
        return false;
      }

      const cacheKey = `viewed_listings_${viewerId || 'guest'}`;
      let viewedList: string[] = [];
      try {
        const stored = localStorage.getItem(cacheKey);
        if (stored) viewedList = JSON.parse(stored);
      } catch (_) {}

      if (viewedList.includes(id)) {
        return false;
      }

      viewedList.push(id);
      if (viewedList.length > 500) {
        viewedList = viewedList.slice(-500);
      }
      try {
        localStorage.setItem(cacheKey, JSON.stringify(viewedList));
      } catch (_) {}

      await supabase.rpc('increment_view_count', { listing_id: id });
      return true;
    } catch (e) {
      console.error('Error recording unique view:', e);
      return false;
    }
  },

  async getListing(id: string, viewerId?: string): Promise<Listing> {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        category:categories!listings_category_id_fkey(id, name, slug, icon, color),
        seller:users!listings_seller_id_fkey(id, full_name, avatar_url, is_verified, phone, city, bio, created_at)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    
    // Increment view count only if unique view
    const wasNewView = await this.recordUniqueView(id, viewerId, data.seller_id);
    if (wasNewView) {
      data.views_count = (data.views_count || 0) + 1;
    }
    
    return data as unknown as Listing;
  },

  async getSellerListings(sellerId: string): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('listings')
      .select(`*, category:categories!listings_category_id_fkey(id, name, slug, icon, color)`)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as unknown as Listing[];
  },

  async createListing(listing: Partial<Listing>): Promise<Listing> {
    const rawCat = listing.category_id;
    const rawSub = listing.subcategory_id;
    const rawSubSub = listing.sub_subcategory_id;

    const dbCatId = cleanUuid(rawCat) || cleanUuid(rawSub) || cleanUuid(rawSubSub) || 'c1000000-0000-0000-0000-000000000011';
    const dbSubId = cleanUuid(rawSub);
    const dbSubSubId = cleanUuid(rawSubSub);

    const attributes = {
      virtual_subcategory_id: rawSub,
      virtual_sub_subcategory_id: rawSubSub,
      ...(listing.attributes || {}),
    };

    const payload = {
      ...listing,
      category_id: dbCatId,
      subcategory_id: dbSubId !== dbCatId ? dbSubId : undefined,
      sub_subcategory_id: dbSubSubId !== dbCatId ? dbSubSubId : undefined,
      attributes,
    };
    const { data, error } = await supabase
      .from('listings')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as Listing;
  },

  async updateListing(id: string, updates: Partial<Listing>): Promise<Listing> {
    const rawCat = updates.category_id;
    const rawSub = updates.subcategory_id;
    const rawSubSub = updates.sub_subcategory_id;

    const dbCatId = rawCat ? (cleanUuid(rawCat) || cleanUuid(rawSub) || cleanUuid(rawSubSub) || 'c1000000-0000-0000-0000-000000000011') : undefined;
    const dbSubId = rawSub ? cleanUuid(rawSub) : undefined;
    const dbSubSubId = rawSubSub ? cleanUuid(rawSubSub) : undefined;

    const attributes = updates.attributes ? {
      ...(rawSub ? { virtual_subcategory_id: rawSub } : {}),
      ...(rawSubSub ? { virtual_sub_subcategory_id: rawSubSub } : {}),
      ...updates.attributes,
    } : undefined;

    const payload = {
      ...updates,
      ...(dbCatId ? { category_id: dbCatId } : {}),
      subcategory_id: dbSubId !== dbCatId ? dbSubId : undefined,
      sub_subcategory_id: dbSubSubId !== dbCatId ? dbSubSubId : undefined,
      ...(attributes ? { attributes } : {}),
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase
      .from('listings')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Listing;
  },

  async deleteListing(id: string): Promise<void> {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async uploadImage(file: File, userId: string): Promise<string> {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('listing-images')
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('listing-images')
      .getPublicUrl(path);
    return publicUrl;
  },

  async deleteImage(url: string): Promise<void> {
    const path = url.split('/listing-images/')[1];
    if (!path) return;
    await supabase.storage.from('listing-images').remove([path]);
  },

  async uploadVideo(file: File, userId: string): Promise<string> {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('listing-videos')
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('listing-videos')
      .getPublicUrl(path);
    return publicUrl;
  },

  async getFeaturedListings(): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('listings')
      .select(`*, category:categories!listings_category_id_fkey(id, name, slug, icon, color), seller:users!listings_seller_id_fkey(id, full_name, avatar_url, is_verified)`)
      .eq('status', 'active')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(12);
    if (error) throw error;
    return data as unknown as Listing[];
  },

  async getRecentListings(limit = 20): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('listings')
      .select(`*, category:categories!listings_category_id_fkey(id, name, slug, icon, color), seller:users!listings_seller_id_fkey(id, full_name, avatar_url, is_verified)`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data as unknown as Listing[];
  },

  async getCategoryListingsHome(categoryId: string, limit = 12): Promise<Listing[]> {
    const { data: allCats } = await supabase.from('categories').select('id, parent_id');
    let query = supabase
      .from('listings')
      .select(`
        *,
        category:categories!listings_category_id_fkey(id, name, slug, icon, color),
        seller:users!listings_seller_id_fkey(id, full_name, avatar_url, is_verified)
      `)
      .eq('status', 'active');

    if (categoryId === 'c1000000-0000-0000-0000-000000000015') {
      query = query.or('category_id.eq.a8dfa959-a83b-438c-8ffb-3faaa43b1626,id.in.(24a25b38-e76d-4a3f-bc4a-10be14a363b6,8932b9d1-4729-42e8-aa4d-713d91657b91)');
    } else if (categoryId === 'c1000000-0000-0000-0000-000000000004' || categoryId === 'jobs' || (categoryId && categoryId.startsWith('d1000000-0000-0000-0000-000000004'))) {
      query = query
        .eq('category_id', 'c1000000-0000-0000-0000-000000000004')
        .or('attributes->>virtual_category_id.is.null,attributes->>virtual_category_id.eq.c1000000-0000-0000-0000-000000000004');
    } else if (categoryId === 'c1000000-0000-0000-0000-000000000006') {
      query = query
        .eq('category_id', 'c1000000-0000-0000-0000-000000000006')
        .or('attributes->>virtual_category_id.is.null,attributes->>virtual_category_id.eq.c1000000-0000-0000-0000-000000000006');
    } else if (categoryId === 'c1000000-0000-0000-0000-000000000016') {
      query = query
        .eq('category_id', 'c1000000-0000-0000-0000-000000000006')
        .or('attributes->>virtual_category_id.eq.c1000000-0000-0000-0000-000000000016,attributes->>virtual_subcategory_id.ilike.d1000000-0000-0000-0000-0000000002%,attributes->>virtual_subcategory_id.ilike.d1000000-0000-0000-0000-00000000030%,attributes->>virtual_subcategory_id.ilike.d1000000-0000-0000-0000-0000000004%,attributes->>virtual_subcategory_id.ilike.d1000000-0000-0000-0000-0000000005%,attributes->>virtual_subcategory_id.ilike.d1000000-0000-0000-0000-0000000006%,attributes->>virtual_subcategory_id.ilike.d1000000-0000-0000-0000-0000000007%,attributes->>virtual_subcategory_id.ilike.d1000000-0000-0000-0000-0000000008%,attributes->>virtual_subcategory_id.ilike.d1000000-0000-0000-0000-0000000009%,attributes->>virtual_subcategory_id.ilike.d1000000-0000-0000-0000-000000000a%');
    } else if (categoryId === 'c1000000-0000-0000-0000-000000000007' || categoryId === 'services' || (categoryId && (categoryId.startsWith('d1000000-0000-0000-0000-000000000d') || categoryId.startsWith('d1000000-0000-0000-0000-000000000e')))) {
      query = query.eq('category_id', 'c1000000-0000-0000-0000-000000000007');
    } else if (categoryId === 'c1000000-0000-0000-0000-000000000009' || categoryId === 'animals' || categoryId === 'pets' || (categoryId && (categoryId.startsWith('d1000000-0000-0000-0000-000000000b') || categoryId.startsWith('d1000000-0000-0000-0000-000000000c')))) {
      query = query.eq('category_id', 'c1000000-0000-0000-0000-000000000009');
    } else if (categoryId === 'c1000000-0000-0000-0000-000000000002') {
      query = query.in('category_id', [
        'c1000000-0000-0000-0000-000000000002',
        '24e59436-fa5b-4fe6-898c-4ce34c4b901f',
        '9ef60e0a-9e89-4a78-86ef-5c9ea8b923dd',
        '4c4a2d5d-7303-4b97-8e1e-775337fe894e',
        '3f9d177a-5fc9-4a78-803e-111cbbd5831c'
      ]).not('id', 'in', '(24a25b38-e76d-4a3f-bc4a-10be14a363b6,8932b9d1-4729-42e8-aa4d-713d91657b91)');
    } else if (allCats) {
      const descendantIds = getDescendantIds(allCats, categoryId);
      query = query.in('category_id', descendantIds);
    } else {
      query = query.eq('category_id', categoryId);
    }

    query = query
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as Listing[];
  },

  async getPendingListings(): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('listings')
      .select(`*, category:categories!listings_category_id_fkey(id, name, slug, icon, color), seller:users!listings_seller_id_fkey(id, full_name, avatar_url)`)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as unknown as Listing[];
  },

  async getAllListingsAdmin(): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('listings')
      .select(`*, category:categories!listings_category_id_fkey(id, name, slug, icon, color), seller:users!listings_seller_id_fkey(id, full_name, avatar_url)`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as unknown as Listing[];
  },
};


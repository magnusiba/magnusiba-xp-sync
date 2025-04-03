const db = require("./firebase");
const supabase = require("./supabaseClient");

async function syncXPBuffer() {
  const today = new Date().toISOString().slice(0, 10); // '2025-04-05'
  const snapshot = await db.collection("xp_buffer").get();

  const userXPMap = {};

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.date === today) {
      if (!userXPMap[data.user_id]) {
        userXPMap[data.user_id] = 0;
      }
      userXPMap[data.user_id] += data.xp_earned;
    }
  });

  for (const [userId, totalXP] of Object.entries(userXPMap)) {
    const { error } = await supabase
      .from("user_summary")
      .upsert({
        user_id: userId,
        total_xp: totalXP,
        last_active: today,
      });

    if (error) {
      console.error(`❌ Failed to update ${userId}:`, error);
    } else {
      console.log(`✅ Synced ${totalXP} XP for user ${userId}`);
    }
  }
}

syncXPBuffer();

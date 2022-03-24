import { app } from './initializers/bolt'
import search_documents from './shortcuts/search_documents'


(async () => {
  // アプリを起動します
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();
search_documents();

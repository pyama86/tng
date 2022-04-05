import { app } from './bolt/bolt'
import search_documents from './shortcuts/search_documents'

(async () => {
  // アプリを起動します
  await app.start(process.env.PORT || 3000);
})();
search_documents();

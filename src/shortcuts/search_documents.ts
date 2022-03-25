import { app } from '../initializers/bolt'
export default function() {
  app.action('new_document', async ({ ack }) => {
    ack();
  });
  app.action('search_document', async ({ ack }) => {
    ack();
  });
  app.shortcut('search_document', async ({ shortcut, ack, logger }) => {
    ack();

    logger.info(shortcut)
    var txt = shortcut.message.text;
    if (!txt) {
      if (shortcut.message.attachments[0]["text"]) {
        txt = shortcut.message.attachments[0]["text"]
      }  else {
        txt = shortcut.message.attachments[0]["title"]
      }
    }
    var urljoin = require('url-join');
    var search_doc_url = new URL(urljoin(process.env.GITHUB_REPO, "/search"))

    // x.x.x.x:y
    txt = txt.replace(/((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9]):[0-9]+/, '');
    // x.x.x.x
    txt = txt.replace(/((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])/, '');

    search_doc_url.searchParams.append('q', txt)
    var new_doc_url = new URL("/new-document", (process.env.ENDPOINT || "http://localhost:3000"))
    new_doc_url.searchParams.append('message', encodeURI(txt))
    new_doc_url.searchParams.append('user', encodeURI(shortcut.user.username))
    try {
      const result = await app.client.chat.postEphemeral({
        user: shortcut.user.id,
        channel: shortcut.channel.id,
        thread_ts: shortcut.ts,
        "text": "操作を選択してください",
        "thread_ts": shortcut.ts,
        "blocks": [
          {
            "type": 'section',
            "text": {
              "type": 'mrkdwn',
              "text": 'ドキュメントを検索する'
            },
            "accessory": {
              "type": 'button',
              "text": {
                "type": 'plain_text',
                "text": '検索',
              },
              "action_id": "search_document",
              "url": search_doc_url.href
            }
          },
          {
            "type": 'section',
            "text": {
              "type": 'mrkdwn',
              "text": '新しくドキュメントを登録する'
            },
            "accessory": {
              "type": 'button',
              "text": {
                "type": 'plain_text',
                "text": '作成',
              },
              "action_id": "new_document",
              "url": new_doc_url.href
            }
          },
        ]
      });
      logger.info(result);
    }
    catch (error) {
      logger.error(error);
    }
  });
}

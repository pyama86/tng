const { App,LogLevel } = require('@slack/bolt');
const NEW_DOCUMENT= `
<!-- reference from: https://sre.google/sre-book/table-of-contents/ -->
# タイトル
%s

## 作成者
@%s
## 概要
<!--
- このメッセージは何を意味するか？
- 考えられる原因はなにか？
- サービスの何に影響するか？
- 誰に通知すべきか?
-->
## メッセージの重大度
<!-- 重大度の理由とメッセージが引き起こす影響-->

## トラブルシューティング
<!--
切り分けの方法や、確認すべき情報を記載します
- メッセージが発生したときに確認すべきログ
- 役に立つスクリプトやコマンド、想定結果など
- メッセージの解消後に確認すべき情報
-->

## 解決策
<!--
このメッセージに対応するために利用できる解決策
- メッセージを止めるために何をすればよいか
- 状況をリセットするために実行するコマンドはなにか？
- このメッセージが発生したときに誰に連絡すべきか？
- この問題に対して専門知識があるのは誰か？
-->

## エスカレーション
<!--
このメッセージが発生したときのエスカレーションのパスを記載します。
-->

## 関連リンク
<!--
このメッセージに対する関連リンクを記載します。
-->


`;
export const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  logLevel: LogLevel.INFO,
  customRoutes: [
    {
      path: '/health-check',
      method: ['GET'],
      handler: (req, res) => {
        res.writeHead(200);
        res.end('Health check information displayed here!');
      },
    },
    {
      path: '/new-document',
      method: ['GET'],
      handler: (req, res) => {
        try {
          var urljoin = require('url-join');
          var sprintf = require('sprintf-js').sprintf;
          var parser = new URL(req.url, (process.env.ENDPOINT || "http://localhost:3000"));
          var message = decodeURI(parser.searchParams.get("message"));
          var user = decodeURI(parser.searchParams.get("user"));
          var redirect_to = new URL(urljoin(process.env.GITHUB_REPO, "new", process.env.GITHUB_BRANCH || "main"));

          redirect_to.searchParams.append('value', sprintf(NEW_DOCUMENT, message, user))
          redirect_to.searchParams.append('filename', message + ".md")
          res.writeHead(302, { Location: redirect_to.href });
          res.end('ok');
        }catch(error) {
          console.log(error)
        }
      },
    },
  ],
});

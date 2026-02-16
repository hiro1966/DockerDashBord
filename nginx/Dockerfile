FROM nginx:alpine

# カスタム設定をコピー
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ヘルスチェック用エンドポイント
RUN echo "OK" > /usr/share/nginx/html/health

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

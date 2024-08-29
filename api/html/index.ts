import { apiToOpenAPI, type API } from "../index"

export const apiToHTML = function (api: API): string {
  const openAPISchema = apiToOpenAPI(api)
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta
    name="description"
    content="SwaggerIU"
  />
  <title>SwaggerUI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.4.1/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@4.4.1/swagger-ui-bundle.js" crossorigin></script>
  <script src="https://unpkg.com/swagger-ui-dist@4.4.1/swagger-ui-standalone-preset.js" crossorigin></script>
  <script>
    const spec = ${JSON.stringify(openAPISchema)};

    window.onload = () => {
      window.ui = SwaggerUIBundle({
        spec,
        dom_id: '#swagger-ui',
      });
    };
  </script>
</body>
</html>
  `
}
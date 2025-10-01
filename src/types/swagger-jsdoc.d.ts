declare module 'swagger-jsdoc' {
  interface SwaggerDefinition {
    openapi: string;
    info: {
      title: string;
      version: string;
      description: string;
      contact?: {
        name: string;
        email: string;
      };
    };
    servers: Array<{
      url: string;
      description: string;
    }>;
    components: {
      securitySchemes: Record<string, unknown>;
      schemas: Record<string, unknown>;
    };
    paths?: Record<string, unknown>;
    security?: Array<Record<string, string[] | undefined>>;
  }

  interface SwaggerOptions {
    definition: SwaggerDefinition;
    apis: string[];
  }

  function swaggerJSDoc(options: SwaggerOptions): SwaggerDefinition;
  export = swaggerJSDoc;
}

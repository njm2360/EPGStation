/// <reference path="./swaggerUiExpress.d.ts" />

import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as openapi from 'express-openapi';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as log4js from 'log4js';
import * as mkdirp from 'mkdirp';
import * as multer from 'multer';
import * as path from 'path';
import * as swaggerUi from 'swagger-ui-express';
import Base from '../Base';
import factory from '../Model/ModelFactory';
import { EncodeFinModelInterface } from '../Model/Service/Encode/EncodeFinModel';
import { SocketIoManageModelInterface } from '../Model/Service/SocketIoManageModel';
import Util from '../Util/Util';
import BasicAuth from './BasicAuth';

/**
 * Server
 */
class Server extends Base {
    private app = express();

    constructor() {
        super();

        // log
        this.app.use(log4js.connectLogger(this.log.access, { level: 'info' }));

        // config
        const config = this.config.getConfig();

        // basic auth
        const basicAuthConfig = config.basicAuth;
        if (typeof basicAuthConfig !== 'undefined') {
            this.app.use(BasicAuth(basicAuthConfig.user, basicAuthConfig.password));
        }

        // read pkg
        const pkg = require(path.join('..', '..', '..', 'package.json'));

        // read api.yml
        const api = <openapi.OpenApi.ApiDefinition> yaml.safeLoad(fs.readFileSync(path.join(__dirname, '..', '..', '..', 'api.yml'), 'utf-8'));
        api.info = {
            title: pkg.name,
            version: pkg.version,
        };

        // swagger ui
        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(api));
        this.app.get('/api/debug', (_req, res) => { return res.redirect('/api-docs/?url=/api/docs'); });


        // uploader dir
        const uploadTempDir = config.uploadTempDir || './data/upload';
        try {
            fs.statSync(uploadTempDir);
        } catch (e) {
            // ディレクトリが存在しなければ作成する
            this.log.system.info(`mkdirp: ${ uploadTempDir }`);
            mkdirp.sync(uploadTempDir);
        }

        // uploader
        const storage = multer.diskStorage({
            destination: uploadTempDir,
            filename: (req, file, cb) => {
                const fileName = file.fieldname + '-' + Date.now();
                cb(null, fileName);

                // 切断時はファイルを削除
                (<any> req).on('close', () => {
                    const filePath = path.join(uploadTempDir, fileName);
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            this.log.access.error(`upload file delete error: ${ filePath }`);
                            this.log.access.error(err.message);
                        } else {
                            this.log.access.info(`delete upload file: ${ filePath }`);
                        }
                    });
                });
            },
        });
        const upload = multer({ storage: storage });

        // init express-openapi
        openapi.initialize({
            apiDoc: api,
            app: this.app,
            consumesMiddleware: {
                'application/json': bodyParser.json(),
                'text/text': bodyParser.text(),
                'multipart/form-data': (req, res, next) => {
                    upload.single('file')(req, res, (err) => {
                        if (err) { return next(err.message); }
                        if (typeof req.file === 'undefined' || typeof req.file.fieldname === 'undefined') { return next('filed name is not found'); }

                        req.body[req.file.fieldname] = req.file;

                        return next();
                    });
                },
            },
            docsPath: '/docs',
            errorMiddleware: (err, _req, res) => {
                res.status(400);
                res.json(err);
            },
            errorTransformer: (openApi) => {
                return openApi.message;
            },
            exposeApiDocs: true,
            paths: path.join(__dirname, 'api'),
        });

        // static mime
        express.static.mime.define({'text/css': ['css', 'min.css']});
        express.static.mime.define({'text/javascript': ['js', 'min.js']});
        express.static.mime.define({'application/vnd.ms-fontobject': ['eot']});
        express.static.mime.define({'application/font-ttf': ['ttf']});
        express.static.mime.define({'application/font-woff': ['woff']});
        express.static.mime.define({'application/font-woff2': ['woff2']});
        express.static.mime.define({'magnus-internal/imagemap': ['map']});
        express.static.mime.define({'image/png': ['png']});
        express.static.mime.define({'image/jpg': ['jpg']});
        express.static.mime.define({'video/mpeg': ['ts']});
        express.static.mime.define({'application/octet-stream': ['m4s']});
        express.static.mime.define({'video/MP2T': ['m3u8']});

        // static files
        this.app.use('/', express.static(path.join(__dirname, '..', '..', '..', 'html')));
        this.app.use('/material-design-icons', express.static(path.join(__dirname, '..', '..', '..', 'node_modules', 'material-design-icons')));
        this.app.use('/material-design-lite', express.static(path.join(__dirname, '..', '..', '..', 'node_modules', 'material-design-lite')));
        this.app.use('/js', express.static(path.join(__dirname, '..', '..', '..', 'dist', 'client')));
        this.app.use('/css', express.static(path.join(__dirname, '..', '..', '..', 'dist', 'css')));
        this.app.use('/img', express.static(path.join(__dirname, '..', '..', '..', 'img')));
        this.app.use('/icon', express.static(path.join(__dirname, '..', '..', '..', 'icon')));

        // thumbnail
        this.app.use('/thumbnail', express.static(Util.getThumbnailPath()));

        // streamfile
        this.app.use('/streamfiles', express.static(Util.getStreamFilePath()));
    }

    /**
     * 開始
     */
    public start(): void {
        const port = this.config.getConfig().serverPort || 8888;
        const server = this.app.listen(port, () => {
            this.log.system.info(`listening on ${ port }`);
        });

        // socket.io
        (<SocketIoManageModelInterface> factory.get('SocketIoManageModel')).initialize(server);

        // encode 終了後
        (<EncodeFinModelInterface> factory.get('EncodeFinModel')).set();
    }
}

export default Server;

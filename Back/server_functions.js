const config        = require('./config.json');
const sql		    = require("mssql");
const keccak256     = require('keccak256'); 
const axios         = require('axios').default;
const FormData      = require('form-data')
const fs            = require('fs');
const mock_vra      = require('./mock_vra.json');
const https      	= require ('https');
const { json }      = require('express');

module.exports = {  validateDocumentSignature,
                    preencheDeclaracao,
                    buscaDadosCNPJ,
                    buscaTipoArquivo,
                    calculaHash,
                    processaURLDeclaracao,
                    montaNomeArquivoDeclaracao,
                    montaNomeArquivoComprovanteDoacao,
                    montaNomeArquivoComprovanteLiquidacao
                };

const DIR_CAMINHO_DECLARACAO             = config.infra.caminhoArquivos + config.infra.caminhoDeclaracao;
const DIR_CAMINHO_COMPROVANTE_DOACAO     = config.infra.caminhoArquivos + config.infra.caminhoComprovanteDoacao;
const DIR_CAMINHO_COMPROVANTE_LIQUIDACAO = config.infra.caminhoArquivos + config.infra.caminhoComprovanteLiquidacao;
const CNPJ_EMPRESA_URL                   = config.infra.cnpjEmpresaURL;
const URLVRA                             = config.infra.vraURL;
const MOCK_VALIDACAO_CERTIFICADO         = config.negocio.mockValidacaoCert;

//Configuracao de acesso ao BD
let configAcessoBDPJ = config.infra.acesso_BD_PJ;
configAcessoBDPJ.password = process.env.BNC_BD_PJ_PASSWORD;
                
async function preencheDeclaracao(cnpj, address, pj, modelo, mockPJ,res) {
  
    const arquivoModelo = require ( config.infra.modeloDeclaracao ); 

    var stringified = JSON.stringify(arquivoModelo);
    stringified = stringified.replace('##CNPJ##', cnpj );
    stringified = stringified.replace('##ADDRESS##', address );
    stringified = stringified.replace('##RAZAOSOCIAL##', pj.dadosCadastrais.razaoSocial );
    stringified = stringified.replace('##LOGRADOURO##', pj.dadosCadastrais.logradouro );
    stringified = stringified.replace('##NUMERO##', pj.dadosCadastrais.numero );
    stringified = stringified.replace('##BAIRRO##', pj.dadosCadastrais.bairro );
    stringified = stringified.replace('##MUNICIPIO##', pj.dadosCadastrais.municipio );
    stringified = stringified.replace('##UF##', pj.dadosCadastrais.uf );
    stringified = stringified.replace('##PAIS##', "BRASIL" );
    stringified = stringified.replace('##CNPJ##', cnpj );
    stringified = stringified.replace('##ADDRESS##', address );
    stringified = stringified.replace('##RAZAOSOCIAL##', pj.dadosCadastrais.razaoSocial );
    
    console.log(pj)    

    console.log(stringified);
    const caminho = './arquivos/tmp/stringified.json';
    fs.writeFileSync(caminho, stringified);

    res.download(caminho);
}

async function buscaDadosCNPJ (cnpj, address, CAMINHO_MODELO_DECLARACAO_CONTA_DIGITAL, mockPJ, res) {
    //console.log('buscaDadosCNPJ::mockPJ=' + mockPJ);
    let cnpjRecebido = cnpj;
let retorno;
    let isNum = /^\d+$/.test(cnpjRecebido);

    if (!isNum) {	
        //console.log("!isNum");
        retorno = {};
        return retorno;
    }


    if (mockPJ) {
        //console.log("mock PJ ON!");

        if ( cnpjRecebido == undefined || cnpjRecebido == '00000undefined' || cnpjRecebido == '00000000000000')	{
            //console.log("cnpj com problema");
            retorno = {};
            return await processaRetornoBuscaDadosCNPJ(cnpj, address, retorno, CAMINHO_MODELO_DECLARACAO_CONTA_DIGITAL, mockPJ,res);
        }
        
        https.get(CNPJ_EMPRESA_URL + cnpjRecebido, (resp)  => {
            let data = '';

            resp.on('data', (chunk) => {
                data += chunk;
            });

            resp.on('end', async () => {
                if (data == "Too many requests, please try again later.") {

                    //console.log(data);
                    let pj = {
                        cnpj: "00000000000000",
                        dadosCadastrais: {
                            razaoSocial: "Serviço da Receita Indisponível"
                        }
                    };
                    retorno = pj;
                    return await processaRetornoBuscaDadosCNPJ(cnpj, address, retorno, CAMINHO_MODELO_DECLARACAO_CONTA_DIGITAL, mockPJ,res);
                }
                else {
                    console.log("else");

                    try {
                        jsonData = await JSON.parse(data);
                    } catch (e) {
                        console.log("catch");
                        return await processaRetornoBuscaDadosCNPJ(cnpj, address, pj, CAMINHO_MODELO_DECLARACAO_CONTA_DIGITAL, mockPJ, res);
                        
                    }
                    //console.log(jsonData);

                    let pj = {
                        cnpj: cnpjRecebido,
                        dadosCadastrais: {
                            razaoSocial: jsonData.nome,
                            logradouro: jsonData.logradouro,
                            numero:     jsonData.numero,
                            bairro:     jsonData.bairro,
                            cep:        jsonData.cep,
                            municipio:  jsonData.municipio,
                            uf:         jsonData.uf
                        }
                    };
                    console.log("pj=");
                    console.log(pj);
                    return await processaRetornoBuscaDadosCNPJ(cnpj, address, pj, CAMINHO_MODELO_DECLARACAO_CONTA_DIGITAL, mockPJ, res);
                    
                }

            });
        }).on("error", (err) => {
            console.log("Erro ao buscar mock da API: " + err.message);
        });

    }
    else {

        new sql.ConnectionPool(configAcessoBDPJ).connect().then(pool => {
            return pool.request()
                                 .input('cnpj', sql.VarChar(14), cnpjRecebido)
                                 .query(config.negocio.query_cnpj)
            
            }).then( async result => {
                let rows = result.recordset

                if (!rows[0]) {
                    retorno = {};
                    return await processaRetornoBuscaDadosCNPJ(cnpj, address, retorno, CAMINHO_MODELO_DECLARACAO_CONTA_DIGITAL, mockPJ,res);
                    
                }

                let pj = 	
                {
                    cnpj: rows[0]["CNPJ_EMPRESA"],
                    dadosCadastrais: {
                        razaoSocial: rows[0]["NOME_EMPRESARIAL"]
                    }
                }

                console.log("pj do QSA");				
                console.log(pj);

                sql.close();
                retorno = pj;
                return await processaRetornoBuscaDadosCNPJ(cnpj, address, retorno, CAMINHO_MODELO_DECLARACAO_CONTA_DIGITAL, mockPJ,res);
                
                


            }).catch(async err => {
                console.log(err);
                retorno = { message: "${err}"};
                sql.close();
                return await processaRetornoBuscaDadosCNPJ(cnpj, address, retorno, CAMINHO_MODELO_DECLARACAO_CONTA_DIGITAL, mockPJ,res);
                
            });


    }
}	

async function processaRetornoBuscaDadosCNPJ(cnpj, address, pj, CAMINHO_MODELO_DECLARACAO_CONTA_DIGITAL, mockPJ,res) {
    return preencheDeclaracao(cnpj, address, pj, CAMINHO_MODELO_DECLARACAO_CONTA_DIGITAL, mockPJ,res);
}

async function validateDocumentSignature(fileReadStream, cnpjEsperado) {
    console.log("validateDocumentSignature");
    console.log("MOCK_VALIDACAO_CERTIFICADO: " + MOCK_VALIDACAO_CERTIFICADO);

    if ( MOCK_VALIDACAO_CERTIFICADO == 1 ) {
        /*
        let grauConformidade         = mock_vra.grauConformidade;
        let certificadoVigente       = mock_vra.informacaoAssinaturas[0].estaVigente;
        let cnpjCertificado          = mock_vra.informacaoAssinaturas[0].informacoesCertificadoIcpBrasil.informacoesCertificado.cnpj;
        return declaracaoEstaValida(grauConformidade, certificadoVigente, cnpjCertificado, cnpjEsperado );
        */
        return 0; 
    } else {
        //fileReadStream = fs.createReadStream('teste.pdf');//cnpjEsperado="31986741000117"
        return await processaDeclaracao(fileReadStream, cnpjEsperado);
    }
    
}

async function processaDeclaracao(declaracaoReadStream, cnpjEsperado) {
    const form = new FormData();
    form.append('', declaracaoReadStream );

    console.log("URL: " + URLVRA);

    const sendPostRequest = async () => {
        try {
            const resposta = await axios.post(URLVRA, form, { headers: form.getHeaders() });
            console.log("VRA - Analisando resposta...")
            let grauConformidade    = resposta.data.grauConformidade;
            let certificadoVigente  = resposta.data.informacaoAssinaturas[0].estaVigente;
            let informacoesCertificado = resposta.data.informacaoAssinaturas[0].informacoesCertificadoIcpBrasil.informacoesCertificado;
            let cnpj = informacoesCertificado.cnpj;
            let cpf  = informacoesCertificado.cpfresponsavel;
            return await declaracaoEstaValida(grauConformidade, certificadoVigente, cnpj, cnpjEsperado );
        } catch (err) {
            console.error("VRA - Não conseguiu processar a resposta");
            console.error(err);
            throw -4; //error4
        }
    };
    
    await sendPostRequest();

}

async function declaracaoEstaValida(grauConformidade, certificadoVigente, cnpjCertificado, cnpjEsperado ) {
    let excecao = 0;
    if ( grauConformidade != "Alta") {
        console.log("grauConformidade != 'Alta' => grauConformidade = " + grauConformidade);
        excecao = -1;
    }
    if ( certificadoVigente == false) {
        console.log("certificadoVigente == false" );
        excecao = -2;
    }
    if ( cnpjCertificado != cnpjEsperado ) {
        console.log("cnpjCertificado != cnpjEsperado" + cnpjCertificado + " != " + cnpjEsperado );
        excecao = -3;
    }

    if ( MOCK_VALIDACAO_CERTIFICADO == 0 && excecao > 0) {
        throw excecao;
    } 

    return 0; //OK
}

async function processaURLDeclaracao(urlDeclaracao, cnpjEsperado) {
    let fileReadStream = fs.createReadStream(urlDeclaracao);
    return processaDeclaracao(fileReadStream, cnpjEsperado);
}

async function buscaTipoArquivo(cnpj, contrato, blockchainAccount, tipo, hashFile) {
    console.log("buscaTipoArquivo");
    let targetPathToCalculateHash;
	
	if (tipo=="declaracao") {
		let fileName = montaNomeArquivoDeclaracao(cnpj, contrato, blockchainAccount, hashFile);
		filePathAndNameToFront = config.infra.caminhoDeclaracao + fileName;
		targetPathToCalculateHash = DIR_CAMINHO_DECLARACAO + fileName;	
	}		
	else if (tipo=="comp_doacao") {
		let fileName = montaNomeArquivoComprovanteDoacao(cnpj, hashFile);			
		filePathAndNameToFront = config.infra.caminhoComprovanteDoacao + fileName;
		targetPathToCalculateHash = DIR_CAMINHO_COMPROVANTE_DOACAO + fileName;	
	}
	else if (tipo=="comp_liq") {
		let fileName = montaNomeArquivoComprovanteLiquidacao(cnpj, contrato, hashFile);						
		filePathAndNameToFront = config.infra.caminhoComprovanteLiquidacao + fileName;
		targetPathToCalculateHash = DIR_CAMINHO_COMPROVANTE_LIQUIDACAO + fileName;	
	}
	else {
		throw "erro tipo desconhecido para buscar arquivo";
    }
    console.log("targetPathToCalculateHash");
    console.log(targetPathToCalculateHash);
	//verifica integridade do arquivo
	let hashedResult = await calculaHash(targetPathToCalculateHash);

	if ( hashedResult != hashFile ) {
		let msg = "Erro conferir o hash do arquivo.";
		console.log(msg);
		throw msg;
		//res.sendStatus(506);
	}
	else {
		console.log("Hash correto");
	}

	return filePathAndNameToFront;
}

function montaNomeArquivoDeclaracao(cnpj, contrato, blockchainAccount, hashFile) {
	return ("DECL" + "_" + cnpj + '_' + contrato + '_' + blockchainAccount + '_' + hashFile +  '.PDF');
}

function montaNomeArquivoComprovanteDoacao(cnpj, hashFile) {
	return ("COMP_DOACAO" + "_" + cnpj + '_' + hashFile +  '.PDF');
}

function montaNomeArquivoComprovanteLiquidacao(cnpj, contrato, hashFile) {
	return ("COMP_LIQ" + "_" + cnpj + '_' + contrato + '_' + hashFile +  '.PDF');
}

async function calculaHash(filename) {
	const input = fs.readFileSync(filename);	
	let hashedResult = keccak256(input).toString('hex');	
	return hashedResult;					
}

function signDocument() {
    //TODO: verify whether this functionality is available through a REST API
    //https://gitlab.bndes.net/sist-smd/smd_spa/blob/develop/smd-back/src/main/java/br/gov/bndes/smd/feature/tramite/laudopericial/LaudoPericialServico.java 
    //  private File assinarDocumentoFinal(DocumentoTramite documentoTramite, long paginaInclusaoAssinaturaVisual, File arquivo, boolean apagarArquivoOrigem)10:39:17
}

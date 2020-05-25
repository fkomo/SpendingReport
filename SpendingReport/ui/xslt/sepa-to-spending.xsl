<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:sepa="urn:iso:std:iso:20022:tech:xsd:camt.053.001.02">
	<xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes"/>

	<xsl:template match="/">
		<SpendingReport>
			<xsl:attribute name="Id">
				<xsl:value-of select="sepa:Document/sepa:BkToCstmrStmt/sepa:Stmt/sepa:Id"/>
			</xsl:attribute>
			<xsl:attribute name="DateTimeFrom">
				<xsl:value-of select="sepa:Document/sepa:BkToCstmrStmt/sepa:Stmt/sepa:FrToDt/sepa:FrDtTm"/>
			</xsl:attribute>
			<xsl:attribute name="DateTimeTo">
				<xsl:value-of select="sepa:Document/sepa:BkToCstmrStmt/sepa:Stmt/sepa:FrToDt/sepa:ToDtTm"/>
			</xsl:attribute>
			<xsl:apply-templates select="sepa:Document/sepa:BkToCstmrStmt/sepa:Stmt/sepa:Bal"/>
			<xsl:element name="AccountTransactions">
				<xsl:apply-templates select="sepa:Document/sepa:BkToCstmrStmt/sepa:Stmt/sepa:Ntry"/>
			</xsl:element>
		</SpendingReport>
	</xsl:template>

	<xsl:template match="sepa:Document/sepa:BkToCstmrStmt/sepa:Stmt/sepa:Bal">
		<xsl:if test="sepa:Tp/sepa:CdOrPrtry/sepa:Cd = 'PRCD' or sepa:Tp/sepa:CdOrPrtry/sepa:Cd = 'CLBD'">
			<xsl:element name="Balance">
				<xsl:attribute name="Date">
					<xsl:value-of select="sepa:Dt/sepa:Dt"/>
				</xsl:attribute>
				<xsl:choose>
					<xsl:when test="sepa:CdtDbtInd != 'CRDT'">-</xsl:when>
					<xsl:otherwise>
					</xsl:otherwise>
				</xsl:choose>
				<xsl:value-of select="sepa:Amt"/>				
			</xsl:element>
		</xsl:if>
	</xsl:template>
	
	<xsl:template match="sepa:Document/sepa:BkToCstmrStmt/sepa:Stmt/sepa:Ntry">
		<xsl:element name="Transaction">
			
			<xsl:attribute name="Id">
				<xsl:value-of select="sepa:NtryRef"/>
			</xsl:attribute>

			<xsl:attribute name="Date">
				<xsl:value-of select="sepa:ValDt/sepa:Dt"/>
			</xsl:attribute>

      <xsl:attribute name="DateObj">
      </xsl:attribute>

      <xsl:attribute name="Amount">
				<xsl:choose>
					<xsl:when test="sepa:CdtDbtInd != 'CRDT'">-<xsl:value-of select="sepa:Amt"/></xsl:when>
					<xsl:otherwise><xsl:value-of select="sepa:Amt"/></xsl:otherwise>
				</xsl:choose>
			</xsl:attribute>

			<xsl:choose>
				<xsl:when test="sepa:CdtDbtInd != 'CRDT'">
					<xsl:if test="sepa:NtryDtls/sepa:TxDtls/sepa:RltdPties/sepa:Cdtr/sepa:Nm != '' and sepa:NtryDtls/sepa:TxDtls/sepa:RltdPties/sepa:Cdtr/sepa:Nm != 'NOTPROVIDED'">
						<xsl:element name="Tag">
							<xsl:attribute name="Source">sepa:NtryDtls/sepa:TxDtls/sepa:RltdPties/sepa:Cdtr/sepa:Nm</xsl:attribute>
							<xsl:value-of select="sepa:NtryDtls/sepa:TxDtls/sepa:RltdPties/sepa:Cdtr/sepa:Nm"/>
						</xsl:element>
					</xsl:if>
					<xsl:if test="sepa:NtryDtls/sepa:TxDtls/sepa:RltdPties/sepa:CdtrAcct/sepa:Nm != '' and sepa:NtryDtls/sepa:TxDtls/sepa:RltdPties/sepa:CdtrAcct/sepa:Nm != 'NOTPROVIDED'">
						<xsl:element name="Tag">
							<xsl:attribute name="Source">sepa:NtryDtls/sepa:TxDtls/sepa:RltdPties/sepa:CdtrAcct/sepa:Nm</xsl:attribute>
							<xsl:value-of select="sepa:NtryDtls/sepa:TxDtls/sepa:RltdPties/sepa:CdtrAcct/sepa:Nm"/>
						</xsl:element>
					</xsl:if>
					<xsl:if test="sepa:NtryDtls/sepa:TxDtls/sepa:RltdPties/sepa:CdtrAcct/sepa:Nm = 'NOTPROVIDED'">
						<xsl:element name="Tag">
							<xsl:attribute name="Source">sepa:NtryDtls/sepa:TxDtls/sepa:RltdPties/sepa:CdtrAcct/sepa:Id/sepa:IBAN</xsl:attribute>
							<xsl:value-of select="sepa:NtryDtls/sepa:TxDtls/sepa:RltdPties/sepa:CdtrAcct/sepa:Id/sepa:IBAN"/>
						</xsl:element>
					</xsl:if>
				</xsl:when>
				<xsl:otherwise>
					<xsl:if test="sepa:NtryDtls/sepa:TxDtls/sepa:RltdPties/sepa:Dbtr/sepa:Nm != '' and sepa:NtryDtls/sepa:TxDtls/sepa:RltdPties/sepa:Dbtr/sepa:Nm != 'NOTPROVIDED'">
						<xsl:element name="Tag">
							<xsl:attribute name="Source">sepa:NtryDtls/sepa:TxDtls/sepa:RltdPties/sepa:Dbtr/sepa:Nm</xsl:attribute>
							<xsl:value-of select="sepa:NtryDtls/sepa:TxDtls/sepa:RltdPties/sepa:Dbtr/sepa:Nm"/>
						</xsl:element>
					</xsl:if>
					<xsl:if test="sepa:NtryDtls/sepa:TxDtls/sepa:RltdPties/sepa:DbtrAcct/sepa:Nm != '' and sepa:NtryDtls/sepa:TxDtls/sepa:RltdPties/sepa:DbtrAcct/sepa:Nm != 'NOTPROVIDED'">
						<xsl:element name="Tag">
							<xsl:attribute name="Source">sepa:NtryDtls/sepa:TxDtls/sepa:RltdPties/sepa:DbtrAcct/sepa:Nm</xsl:attribute>
							<xsl:value-of select="sepa:NtryDtls/sepa:TxDtls/sepa:RltdPties/sepa:DbtrAcct/sepa:Nm"/>
						</xsl:element>
					</xsl:if>
				</xsl:otherwise>
			</xsl:choose>

			<xsl:if test="sepa:NtryDtls/sepa:TxDtls/sepa:Refs/sepa:EndToEndId != 'NOTPROVIDED'">
				<xsl:element name="Tag">
					<xsl:attribute name="Source">sepa:NtryDtls/sepa:TxDtls/sepa:Refs/sepa:EndToEndId</xsl:attribute>
					<xsl:value-of select="sepa:NtryDtls/sepa:TxDtls/sepa:Refs/sepa:EndToEndId"/>
				</xsl:element>
			</xsl:if>
			
			<xsl:element name="Tag">
				<xsl:attribute name="Source">sepa:NtryDtls/sepa:TxDtls/sepa:RmtInf/sepa:Ustrd</xsl:attribute>
				<xsl:value-of select="sepa:NtryDtls/sepa:TxDtls/sepa:RmtInf/sepa:Ustrd"/>
			</xsl:element>
			
		</xsl:element>
	</xsl:template>
	
</xsl:stylesheet>
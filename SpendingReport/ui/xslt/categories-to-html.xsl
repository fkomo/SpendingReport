<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes"/>
	
	<xsl:template match="/">
		<div id="categories" class="categories-table content animated-collapsible-table">
			<xsl:apply-templates select="CategoryTags/Category"/>
			<div class="categories-row">
				<div class="categories-row-cell left-align">
					<div class="hilightable category color0" onclick="AddCategory()">Add Category ...</div>
				</div>
				<div class="categories-row-cell left-align"></div>
			</div>
		</div>
	</xsl:template>

	<xsl:template match="CategoryTags/Category">
		<div class="categories-row">
			<div class="categories-row-cell">
				<label class="category-switch">
					<input type="checkbox" checked="checked">
						<xsl:attribute name="id">categoryCheck<xsl:value-of select="@Id"/></xsl:attribute>
						<xsl:attribute name="onchange">CategoryChecked('<xsl:value-of select="@Id"/>', true)</xsl:attribute>
					</input>
					<span>
						<xsl:attribute name="id">categoryCheckSpan<xsl:value-of select="@Id"/></xsl:attribute>
						<xsl:attribute name="class">category-slider hilightable color<xsl:value-of select="@Id"/></xsl:attribute>
					</span>
				</label>
			</div>
			<div class="categories-row-cell left-align">
				<div>
					<xsl:attribute name="id">category<xsl:value-of select="@Id"/></xsl:attribute>
					<xsl:attribute name="class">hilightable category color<xsl:value-of select="@Id"/></xsl:attribute>
					<xsl:attribute name="onclick">RemoveCategory('<xsl:value-of select="@Name"/>')</xsl:attribute>
					<xsl:value-of select="@Name"/>
				</div>
				<div class="tag-element hilightable"><xsl:attribute name="onclick">AddTag('<xsl:value-of select="@Name"/>')</xsl:attribute>Add Tag ...</div>
			</div>
		</div>
		<div class="categories-row">
			<div class="categories-row-cell left-align">
				<ul class="tag-list">
					<xsl:attribute name="id">category<xsl:value-of select="@Id"/>-tag-list</xsl:attribute>
					<xsl:apply-templates select="Tag"/>
				</ul>
			</div>
		</div>
	</xsl:template>

	<xsl:template match="Tag">
		<li>
			<xsl:attribute name="id"><xsl:value-of select="../@Id"/>-<xsl:value-of select="."/>-tag</xsl:attribute>
			<xsl:attribute name="class">hilightable</xsl:attribute>
			<xsl:attribute name="onclick">RemoveTag('<xsl:value-of select="."/>')</xsl:attribute>
			<xsl:value-of select="."/>
		</li>
	</xsl:template>
	
</xsl:stylesheet>
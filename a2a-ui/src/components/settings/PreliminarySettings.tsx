"use client";

import { UploadFile } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Container,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import React from "react";

import { extractText } from "@/lib/api/extractText";
import { defaultSelections, buildQaMetadata } from "@/lib/qaSettings";
import { ControlSchema, ModeSchema, QaMetadata, QaSelections } from "@/types/qa";

interface PreliminarySettingsProps {
  modes: ModeSchema[];
  loading?: boolean;
  /** False when no agent is available yet (sending would fail). */
  canSubmit?: boolean;
  /** Orchestrator base URL — used to upload .docx for text extraction. */
  agentBaseUrl?: string;
  onSubmit: (requirement: string, metadata: QaMetadata) => void;
}

export const PreliminarySettings: React.FC<PreliminarySettingsProps> = ({
  modes,
  loading = false,
  canSubmit = true,
  agentBaseUrl,
  onSubmit,
}) => {
  // Single mode for now ("Тест-кейсы"); the schema is built to support more later.
  const mode: ModeSchema | undefined = modes[0];

  const [selections, setSelections] = React.useState<QaSelections>(
    mode ? defaultSelections(mode) : {}
  );
  const [requirement, setRequirement] = React.useState<string>("");
  // Risk analysis is opt-in (off by default).
  const [riskAnalysis, setRiskAnalysis] = React.useState<boolean>(false);
  const [uploading, setUploading] = React.useState<boolean>(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Reset selections when the mode/schema changes (e.g. backend schema arrives).
  React.useEffect(() => {
    if (mode) {
      setSelections(defaultSelections(mode));
    }
  }, [mode]);

  if (!mode) {
    return null;
  }

  const handleMultiChange = (controlId: string, values: string[]): void => {
    setSelections((prev) => ({ ...prev, [controlId]: values }));
  };

  const handleSingleChange = (controlId: string, value: string | null): void => {
    if (value !== null) {
      setSelections((prev) => ({ ...prev, [controlId]: [value] }));
    }
  };

  const handleSubmit = (): void => {
    const text = requirement.trim();
    if (!text) {
      return;
    }
    onSubmit(text, buildQaMetadata(mode.id, selections, riskAnalysis));
  };

  const handleFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file
    if (!file || !agentBaseUrl) {
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const result = await extractText(file, agentBaseUrl);
      setRequirement(result.text);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Не удалось извлечь текст");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ height: "100%", overflow: "auto", bgcolor: "background.paper" }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Генерация: {mode.label}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Задайте параметры, вставьте требование и нажмите «Сгенерировать».
        </Typography>

        <Stack spacing={3}>
          {mode.controls.map((control: ControlSchema) => (
            <Box key={control.id}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                {control.label}
              </Typography>

              {control.type === "multi" ? (
                <ToggleButtonGroup
                  value={selections[control.id] ?? []}
                  onChange={(_e, values: string[]) => handleMultiChange(control.id, values)}
                  size="small"
                  sx={{ flexWrap: "wrap", gap: 1 }}
                >
                  {control.options.map((option) => (
                    <ToggleButton key={option.id} value={option.id} sx={{ borderRadius: 2 }}>
                      {option.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              ) : (
                <ToggleButtonGroup
                  exclusive
                  value={selections[control.id]?.[0] ?? null}
                  onChange={(_e, value: string | null) => handleSingleChange(control.id, value)}
                  size="small"
                  sx={{ flexWrap: "wrap", gap: 1 }}
                >
                  {control.options.map((option) => (
                    <ToggleButton key={option.id} value={option.id} sx={{ borderRadius: 2 }}>
                      {option.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              )}
            </Box>
          ))}

          <Box>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx"
              hidden
              onChange={handleFileSelected}
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<UploadFile />}
              disabled={uploading || !agentBaseUrl}
              onClick={() => fileInputRef.current?.click()}
              sx={{ mb: 1 }}
            >
              {uploading ? "Извлечение…" : "Загрузить .docx"}
            </Button>
            {uploadError && (
              <Alert severity="error" sx={{ mb: 1 }}>
                {uploadError}
              </Alert>
            )}
            <TextField
              label="Требование"
              placeholder="Вставьте текст требования или загрузите .docx…"
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              multiline
              minRows={6}
              fullWidth
            />
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={riskAnalysis}
                onChange={(e) => setRiskAnalysis(e.target.checked)}
              />
            }
            label="Анализ рисков (Risk Analysis)"
          />

          {!canSubmit && (
            <Alert severity="warning">
              Агент ещё не подключён. Убедитесь, что оркестратор запущен (http://localhost:8080).
            </Alert>
          )}

          <Box>
            <Button
              variant="contained"
              size="large"
              disabled={!requirement.trim() || !canSubmit || loading}
              onClick={handleSubmit}
            >
              Сгенерировать
            </Button>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};
